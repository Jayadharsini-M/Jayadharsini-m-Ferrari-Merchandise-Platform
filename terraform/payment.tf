# ================================================================
# payment.tf — Payment Service Lambda + API Routes (FIXED)
# ================================================================

# ── Lambda Function ───────────────────────────────────────────
resource "aws_lambda_function" "payment_service" {
  function_name    = "${var.environment}-ferrari-payment-service"
  filename         = "${path.module}/payment_service.zip"
  source_code_hash = filebase64sha256("${path.module}/payment_service.zip")
  role             = aws_iam_role.lambda_role.arn
  handler          = "lambda_function.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 128
  publish          = true # ✅ enable versioning like other services

  environment {
    variables = {
      ORDERS_TABLE      = var.orders_table_name
      PRODUCTS_TABLE    = var.products_table_name
      CART_TABLE        = var.carts_table_name
      STRIPE_SECRET_KEY = var.stripe_secret_key
      ENVIRONMENT       = var.environment
      API_VERSION       = var.api_version # ✅ added for consistency
    }
  }

  tags = local.common_tags
}

# ── Lambda Alias (for /v1 versioning) ──────────────────────────
resource "aws_lambda_alias" "payment_service_alias" {
  name             = var.api_version # e.g. "v1"
  function_name    = aws_lambda_function.payment_service.function_name
  function_version = aws_lambda_function.payment_service.version
}

# ── Lambda Permission ─────────────────────────────────────────
resource "aws_lambda_permission" "payment_service" {
  statement_id  = "AllowAPIGatewayInvokePayment"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_service.function_name
  qualifier     = aws_lambda_alias.payment_service_alias.name # ✅ alias
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ferrari_api.execution_arn}/*"
}

# ── API Gateway Integration ───────────────────────────────────
resource "aws_apigatewayv2_integration" "payment_service" {
  api_id                 = aws_apigatewayv2_api.ferrari_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_alias.payment_service_alias.invoke_arn # ✅ alias
  payload_format_version = "2.0"
}

# ── API Routes (FIXED WITH /v1 PREFIX) ─────────────────────────
resource "aws_apigatewayv2_route" "post_payment" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "POST /${var.api_version}/payment"
  target    = "integrations/${aws_apigatewayv2_integration.payment_service.id}"
}

resource "aws_apigatewayv2_route" "get_payment_health" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "GET /${var.api_version}/payment"
  target    = "integrations/${aws_apigatewayv2_integration.payment_service.id}"
}