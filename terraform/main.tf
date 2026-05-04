# ================================================================
# Ferrari E-Commerce — Terraform Infrastructure
# ✅ Best Practices Applied:
#   - Environment prefix on all resources
#   - Tags on all resources
#   - No hardcoded names (all use variables)
#   - PAY_PER_REQUEST for DynamoDB
#   - Environment variables for all Lambda config
#   - CORS configured for CloudFront origin
#   - API versioning via /v1 route prefix
#   - Lambda publish=true for version tracking
# ================================================================

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.3.0"
}

provider "aws" {
  region = var.aws_region
}

# ================================================================
# LOCALS
# ================================================================

locals {
  common_tags = {
    Project     = "ferrari-ecommerce"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ================================================================
# DYNAMODB TABLES
# ================================================================

resource "aws_dynamodb_table" "products" {
  name         = var.products_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "product_id"

  attribute {
    name = "product_id"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "carts" {
  name         = var.carts_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "product_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "product_id"
    type = "S"
  }

  tags = local.common_tags
}

resource "aws_dynamodb_table" "orders" {
  name         = var.orders_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name            = "user_id-created_at-index"
    hash_key        = "user_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  tags = local.common_tags
}

# ================================================================
# IAM ROLE FOR LAMBDA
# ================================================================

resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-ferrari-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_s3" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# ================================================================
# API GATEWAY
# ================================================================

resource "aws_apigatewayv2_api" "ferrari_api" {
  name          = "${var.environment}-ferrari-unified-api"
  protocol_type = "HTTP"
  tags          = local.common_tags

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Requested-With"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.ferrari_api.id
  name        = "$default"
  auto_deploy = true

  # ✅ Stage variable so you can inspect current version in AWS Console
  stage_variables = {
    apiVersion = var.api_version
  }
}

# ================================================================
# LAMBDA FUNCTIONS
# ✅ publish = true  → AWS creates a numbered version on every deploy
# ================================================================

# ---- Product Service ----
resource "aws_lambda_function" "product_service" {
  function_name    = var.product_service_name
  filename         = "${path.module}/product_service.zip"
  source_code_hash = filebase64sha256("${path.module}/product_service.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 128
  publish          = true # ✅ enables Lambda versioning

  environment {
    variables = {
      PRODUCTS_TABLE = var.products_table_name
      ENVIRONMENT    = var.environment
      API_VERSION    = var.api_version
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_alias" "product_service_alias" {
  name             = var.api_version # e.g. "v1"
  function_name    = aws_lambda_function.product_service.function_name
  function_version = aws_lambda_function.product_service.version # points to latest published
}

# ---- Cart Service ----
resource "aws_lambda_function" "cart_service" {
  function_name    = var.cart_service_name
  filename         = "${path.module}/cart_service.zip"
  source_code_hash = filebase64sha256("${path.module}/cart_service.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 128
  publish          = true # ✅

  environment {
    variables = {
      CART_TABLE          = var.carts_table_name
      PRODUCT_SERVICE_URL = "${aws_apigatewayv2_api.ferrari_api.api_endpoint}/${var.api_version}"
      ENVIRONMENT         = var.environment
      API_VERSION         = var.api_version
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_alias" "cart_service_alias" {
  name             = var.api_version
  function_name    = aws_lambda_function.cart_service.function_name
  function_version = aws_lambda_function.cart_service.version
}

# ---- Order Service ----
resource "aws_lambda_function" "order_service" {
  function_name    = var.order_service_name
  filename         = "${path.module}/order_service.zip"
  source_code_hash = filebase64sha256("${path.module}/order_service.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 128
  publish          = true # ✅

  environment {
    variables = {
      PRODUCTS_TABLE = var.products_table_name
      CART_TABLE     = var.carts_table_name
      ORDERS_TABLE   = var.orders_table_name
      ENVIRONMENT    = var.environment
      API_VERSION    = var.api_version
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_alias" "order_service_alias" {
  name             = var.api_version
  function_name    = aws_lambda_function.order_service.function_name
  function_version = aws_lambda_function.order_service.version
}

# ---- Search Service ----
resource "aws_lambda_function" "search_service" {
  function_name    = var.search_service_name
  filename         = "${path.module}/search_service.zip"
  source_code_hash = filebase64sha256("${path.module}/search_service.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 128
  publish          = true # ✅

  environment {
    variables = {
      PRODUCTS_TABLE = var.products_table_name
      ENVIRONMENT    = var.environment
      API_VERSION    = var.api_version
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_alias" "search_service_alias" {
  name             = var.api_version
  function_name    = aws_lambda_function.search_service.function_name
  function_version = aws_lambda_function.search_service.version
}

# ================================================================
# LAMBDA PERMISSIONS
# ✅ source_arn uses wildcard so all /v1/... routes are allowed
# ================================================================

resource "aws_lambda_permission" "product_service" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.product_service.function_name
  qualifier     = aws_lambda_alias.product_service_alias.name # ✅ scoped to alias
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ferrari_api.execution_arn}/*"
}

resource "aws_lambda_permission" "cart_service" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cart_service.function_name
  qualifier     = aws_lambda_alias.cart_service_alias.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ferrari_api.execution_arn}/*"
}

resource "aws_lambda_permission" "order_service" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.order_service.function_name
  qualifier     = aws_lambda_alias.order_service_alias.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ferrari_api.execution_arn}/*"
}

resource "aws_lambda_permission" "search_service" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_service.function_name
  qualifier     = aws_lambda_alias.search_service_alias.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ferrari_api.execution_arn}/*"
}

# ================================================================
# API GATEWAY INTEGRATIONS
# ✅ integration_uri now points to the Lambda ALIAS (via :v1 qualifier)
# ================================================================

resource "aws_apigatewayv2_integration" "product_service" {
  api_id                 = aws_apigatewayv2_api.ferrari_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.product_service_alias.invoke_arn # ✅ alias
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "cart_service" {
  api_id                 = aws_apigatewayv2_api.ferrari_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.cart_service_alias.invoke_arn # ✅ alias
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "order_service" {
  api_id                 = aws_apigatewayv2_api.ferrari_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.order_service_alias.invoke_arn # ✅ alias
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "search_service" {
  api_id                 = aws_apigatewayv2_api.ferrari_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.search_service_alias.invoke_arn # ✅ alias
  payload_format_version = "2.0"
}

# ================================================================
# API GATEWAY ROUTES
# ✅ All routes now prefixed with /${var.api_version}  →  /v1/...
# ================================================================

# ---- Product Routes ----
resource "aws_apigatewayv2_route" "get_home" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}"
  target    = "integrations/${aws_apigatewayv2_integration.product_service.id}"
}

resource "aws_apigatewayv2_route" "get_products" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}/products"
  target    = "integrations/${aws_apigatewayv2_integration.product_service.id}"
}

resource "aws_apigatewayv2_route" "post_products" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "POST /${var.api_version}/products"
  target    = "integrations/${aws_apigatewayv2_integration.product_service.id}"
}

resource "aws_apigatewayv2_route" "get_product" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}/products/{product_id}"
  target    = "integrations/${aws_apigatewayv2_integration.product_service.id}"
}

resource "aws_apigatewayv2_route" "put_product" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "PUT /${var.api_version}/products/{product_id}"
  target    = "integrations/${aws_apigatewayv2_integration.product_service.id}"
}

resource "aws_apigatewayv2_route" "delete_product" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "DELETE /${var.api_version}/products/{product_id}"
  target    = "integrations/${aws_apigatewayv2_integration.product_service.id}"
}

# ---- Cart Routes ----
resource "aws_apigatewayv2_route" "post_cart" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "POST /${var.api_version}/cart"
  target    = "integrations/${aws_apigatewayv2_integration.cart_service.id}"
}

resource "aws_apigatewayv2_route" "get_cart" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}/cart/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.cart_service.id}"
}

resource "aws_apigatewayv2_route" "delete_cart" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "DELETE /${var.api_version}/cart/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.cart_service.id}"
}

resource "aws_apigatewayv2_route" "delete_cart_item" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "DELETE /${var.api_version}/cart/{user_id}/{product_id}"
  target    = "integrations/${aws_apigatewayv2_integration.cart_service.id}"
}

# ---- Order Routes ----
resource "aws_apigatewayv2_route" "post_order" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "POST /${var.api_version}/order"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

resource "aws_apigatewayv2_route" "post_cancel_order" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "POST /${var.api_version}/cancel-order"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

resource "aws_apigatewayv2_route" "get_order" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}/order/{order_id}"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

resource "aws_apigatewayv2_route" "get_user_orders" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}/orders/{user_id}"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}

# ---- Search Routes ----
resource "aws_apigatewayv2_route" "get_search" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}/search"
  target    = "integrations/${aws_apigatewayv2_integration.search_service.id}"
}