# ================================================================
# CORS — Ferrari E-Commerce
# The main CORS headers are set in aws_apigatewayv2_api in main.tf
# This file only adds the OPTIONS catch-all route
# ================================================================

resource "aws_apigatewayv2_route" "options_proxy" {
  api_id    = aws_apigatewayv2_api.ferrari_api.id
  route_key = "OPTIONS /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.order_service.id}"
}