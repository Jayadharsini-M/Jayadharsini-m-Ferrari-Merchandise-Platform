# ================================================================
# frontend.tf — Ferrari E-Commerce Frontend Infrastructure
# S3 + CloudFront (OAC) — DO NOT modify main.tf
# ================================================================

# ── S3 Bucket (private — CloudFront only) ─────────────────────
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.environment}-ferrari-frontend-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Origin Access Control (OAC) ───────────────────────────────
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.environment}-ferrari-oac"
  description                       = "OAC for Ferrari Frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── CloudFront Distribution ────────────────────────────────────
resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  comment             = "${var.environment}-ferrari-frontend"
  tags                = local.common_tags

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-ferrari-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "S3-ferrari-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # React Router fix — serve index.html for all routes
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# ── S3 Bucket Policy — CloudFront access only ─────────────────
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontServicePrincipal"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.frontend.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
        }
      }
    }]
  })
}

# ── Upload React Build Files to S3 ────────────────────────────
resource "aws_s3_object" "frontend_files" {
  for_each = fileset(var.frontend_build_path, "**")

  bucket = aws_s3_bucket.frontend.id
  key    = each.value
  source = "${var.frontend_build_path}/${each.value}"
  etag   = filemd5("${var.frontend_build_path}/${each.value}")

  content_type = lookup({
    "html" = "text/html"
    "css"  = "text/css"
    "js"   = "application/javascript"
    "json" = "application/json"
    "png"  = "image/png"
    "jpg"  = "image/jpeg"
    "jpeg" = "image/jpeg"
    "svg"  = "image/svg+xml"
    "ico"  = "image/x-icon"
    "txt"  = "text/plain"
  }, reverse(split(".", each.value))[0], "application/octet-stream")
}

# ── Data source for account ID ────────────────────────────────
data "aws_caller_identity" "current" {}