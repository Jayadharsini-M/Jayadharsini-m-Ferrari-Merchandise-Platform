# ================================================================
# Variables — Ferrari E-Commerce
# ✅ Best Practice: Use variables for all names
# ✅ Best Practice: Use environment prefix to avoid conflicts
# ================================================================

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment prefix for all resources"
  type        = string
  default     = "dev"
}

# ----------------------------------------------------------------
# API Versioning
# ✅ Bump this when you want to publish a new version
# ----------------------------------------------------------------
variable "api_version" {
  description = "API version prefix used in all routes"
  type        = string
  default     = "v1"
}

# ----------------------------------------------------------------
# DynamoDB Table Names
# ✅ Best Practice: Prefixed with environment
# ----------------------------------------------------------------
variable "products_table_name" {
  description = "DynamoDB products table name"
  type        = string
  default     = "dev-ferrari-products"
}

variable "carts_table_name" {
  description = "DynamoDB carts table name"
  type        = string
  default     = "dev-ferrari-carts"
}

variable "orders_table_name" {
  description = "DynamoDB orders table name"
  type        = string
  default     = "dev-ferrari-orders"
}

# ----------------------------------------------------------------
# Lambda Function Names
# ✅ Best Practice: Prefixed with environment
# ----------------------------------------------------------------
variable "product_service_name" {
  description = "Product Lambda function name"
  type        = string
  default     = "dev-ferrari-product-service"
}

variable "cart_service_name" {
  description = "Cart Lambda function name"
  type        = string
  default     = "dev-ferrari-cart-service"
}

variable "order_service_name" {
  description = "Order Lambda function name"
  type        = string
  default     = "dev-ferrari-order-service"
}

variable "search_service_name" {
  description = "Search Lambda function name"
  type        = string
  default     = "dev-ferrari-search-service"
}

variable "stripe_secret_key" {
  description = "Stripe secret key for payment processing"
  type        = string
  sensitive   = true
  default     = ""
}

variable "frontend_build_path" {
  description = "Path to React build folder"
  type        = string
  default     = "C:/Users/jayadharsini.m/ferrari-ecommerce/frontend/ferrari-frontend/build"
}
variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

