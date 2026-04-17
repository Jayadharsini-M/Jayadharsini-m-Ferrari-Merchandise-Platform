# ================================================================
# Outputs — Ferrari E-Commerce
# ================================================================

output "api_gateway_url" {
  description = "Unified API Gateway URL — use this in Postman"
  value       = aws_apigatewayv2_api.ferrari_api.api_endpoint
}

output "product_service_name" {
  description = "Product Lambda function name"
  value       = aws_lambda_function.product_service.function_name
}

output "cart_service_name" {
  description = "Cart Lambda function name"
  value       = aws_lambda_function.cart_service.function_name
}

output "order_service_name" {
  description = "Order Lambda function name"
  value       = aws_lambda_function.order_service.function_name
}

output "search_service_name" {
  description = "Search Lambda function name"
  value       = aws_lambda_function.search_service.function_name
}

output "products_table_name" {
  description = "DynamoDB products table name"
  value       = aws_dynamodb_table.products.name
}

output "carts_table_name" {
  description = "DynamoDB carts table name"
  value       = aws_dynamodb_table.carts.name
}

output "orders_table_name" {
  description = "DynamoDB orders table name"
  value       = aws_dynamodb_table.orders.name
}
output "frontend_bucket_name" {
  description = "S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_url" {
  description = "CloudFront URL — your live frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "payment_service_name" {
  description = "Payment Lambda function name"
  value       = aws_lambda_function.payment_service.function_name
}