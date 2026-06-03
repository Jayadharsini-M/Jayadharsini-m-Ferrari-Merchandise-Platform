# ================================================================
# cloudwatch.tf — Ferrari E-Commerce Observability
# ================================================================

resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-ferrari-alerts"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# ================================================================
# LOG GROUPS
# ================================================================

resource "aws_cloudwatch_log_group" "product_service" {
  name              = "/aws/lambda/${aws_lambda_function.product_service.function_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "cart_service" {
  name              = "/aws/lambda/${aws_lambda_function.cart_service.function_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "order_service" {
  name              = "/aws/lambda/${aws_lambda_function.order_service.function_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "search_service" {
  name              = "/aws/lambda/${aws_lambda_function.search_service.function_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "payment_service" {
  name              = "/aws/lambda/${aws_lambda_function.payment_service.function_name}"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.environment}-ferrari-api"
  retention_in_days = var.log_retention_days
  tags              = local.common_tags
}

# ================================================================
# ALARMS
# ================================================================

resource "aws_cloudwatch_metric_alarm" "payment_errors" {
  alarm_name          = "${var.environment}-ferrari-payment-errors"
  alarm_description   = "Payment Lambda errors exceeded threshold"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.payment_service.function_name }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 3
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.environment}-ferrari-api-latency"
  alarm_description   = "API Gateway p99 latency exceeded 2000ms"
  namespace           = "AWS/ApiGateway"
  metric_name         = "IntegrationLatency"
  dimensions          = { ApiId = aws_apigatewayv2_api.ferrari_api.id }
  extended_statistic  = "p99"
  period              = 60
  evaluation_periods  = 2
  threshold           = 2000
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.environment}-ferrari-lambda-errors"
  alarm_description   = "Combined Lambda errors exceeded 5"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 5
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = local.common_tags

  metric_query {
    id          = "total_errors"
    expression  = "SUM(METRICS())"
    label       = "Total Lambda Errors"
    return_data = true
  }
  metric_query {
    id = "e1"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "Errors"
      period      = 60
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.product_service.function_name }
    }
  }
  metric_query {
    id = "e2"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "Errors"
      period      = 60
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.cart_service.function_name }
    }
  }
  metric_query {
    id = "e3"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "Errors"
      period      = 60
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.order_service.function_name }
    }
  }
  metric_query {
    id = "e4"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "Errors"
      period      = 60
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.search_service.function_name }
    }
  }
  metric_query {
    id = "e5"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "Errors"
      period      = 60
      stat        = "Sum"
      dimensions  = { FunctionName = aws_lambda_function.payment_service.function_name }
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.environment}-ferrari-dynamodb-throttles"
  alarm_description   = "DynamoDB throttle events detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  tags                = local.common_tags

  metric_query {
    id          = "total_throttles"
    expression  = "r1 + r2 + r3 + w1 + w2 + w3"
    label       = "Total DynamoDB Throttles"
    return_data = true
  }
  metric_query {
    id = "r1"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "ReadThrottleEvents"
      period      = 60
      stat        = "Sum"
      dimensions  = { TableName = aws_dynamodb_table.products.name }
    }
  }
  metric_query {
    id = "r2"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "ReadThrottleEvents"
      period      = 60
      stat        = "Sum"
      dimensions  = { TableName = aws_dynamodb_table.carts.name }
    }
  }
  metric_query {
    id = "r3"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "ReadThrottleEvents"
      period      = 60
      stat        = "Sum"
      dimensions  = { TableName = aws_dynamodb_table.orders.name }
    }
  }
  metric_query {
    id = "w1"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "WriteThrottleEvents"
      period      = 60
      stat        = "Sum"
      dimensions  = { TableName = aws_dynamodb_table.products.name }
    }
  }
  metric_query {
    id = "w2"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "WriteThrottleEvents"
      period      = 60
      stat        = "Sum"
      dimensions  = { TableName = aws_dynamodb_table.carts.name }
    }
  }
  metric_query {
    id = "w3"
    metric {
      namespace   = "AWS/Lambda"
      metric_name = "WriteThrottleEvents"
      period      = 60
      stat        = "Sum"
      dimensions  = { TableName = aws_dynamodb_table.orders.name }
    }
  }
}

# ================================================================
# DASHBOARD
# ================================================================

resource "aws_cloudwatch_dashboard" "ferrari" {
  dashboard_name = "Ferrari-Ecommerce-Observability"

  dashboard_body = jsonencode({
    widgets = [

      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = { markdown = "## 🏎️ Lambda Functions" }
      },

      {
        type   = "metric"
        x      = 0
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "Lambda — Invocations"
          view   = "timeSeries"
          region = var.aws_region
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.product_service.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.cart_service.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.order_service.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.search_service.function_name],
            ["AWS/Lambda", "Invocations", "FunctionName", aws_lambda_function.payment_service.function_name],
          ]
        }
      },

      {
        type   = "metric"
        x      = 8
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "Lambda — Duration (ms)"
          view   = "timeSeries"
          region = var.aws_region
          period = 60
          stat   = "p99"
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.product_service.function_name],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.cart_service.function_name],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.order_service.function_name],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.search_service.function_name],
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.payment_service.function_name],
          ]
        }
      },

      {
        type   = "metric"
        x      = 16
        y      = 1
        width  = 8
        height = 6
        properties = {
          title  = "Lambda — Errors"
          view   = "timeSeries"
          region = var.aws_region
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.product_service.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.cart_service.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.order_service.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.search_service.function_name],
            ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.payment_service.function_name],
          ]
        }
      },

      {
        type   = "metric"
        x      = 0
        y      = 7
        width  = 8
        height = 6
        properties = {
          title  = "Lambda — Throttles"
          view   = "timeSeries"
          region = var.aws_region
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.product_service.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.cart_service.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.order_service.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.search_service.function_name],
            ["AWS/Lambda", "Throttles", "FunctionName", aws_lambda_function.payment_service.function_name],
          ]
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 13
        width  = 24
        height = 1
        properties = { markdown = "## 🌐 API Gateway" }
      },

      {
        type   = "metric"
        x      = 0
        y      = 14
        width  = 6
        height = 6
        properties = {
          title   = "API — Request Count"
          view    = "timeSeries"
          region  = var.aws_region
          period  = 60
          stat    = "Sum"
          metrics = [["AWS/ApiGateway", "Count", "ApiId", aws_apigatewayv2_api.ferrari_api.id]]
        }
      },

      {
        type   = "metric"
        x      = 6
        y      = 14
        width  = 6
        height = 6
        properties = {
          title   = "API — Latency (ms)"
          view    = "timeSeries"
          region  = var.aws_region
          period  = 60
          stat    = "p99"
          metrics = [["AWS/ApiGateway", "IntegrationLatency", "ApiId", aws_apigatewayv2_api.ferrari_api.id]]
        }
      },

      {
        type   = "metric"
        x      = 12
        y      = 14
        width  = 6
        height = 6
        properties = {
          title   = "API — 4XX Errors"
          view    = "timeSeries"
          region  = var.aws_region
          period  = 60
          stat    = "Sum"
          metrics = [["AWS/ApiGateway", "4xx", "ApiId", aws_apigatewayv2_api.ferrari_api.id]]
        }
      },

      {
        type   = "metric"
        x      = 18
        y      = 14
        width  = 6
        height = 6
        properties = {
          title   = "API — 5XX Errors"
          view    = "timeSeries"
          region  = var.aws_region
          period  = 60
          stat    = "Sum"
          metrics = [["AWS/ApiGateway", "5xx", "ApiId", aws_apigatewayv2_api.ferrari_api.id]]
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 20
        width  = 24
        height = 1
        properties = { markdown = "## 🗄️ DynamoDB" }
      },

      {
        type   = "metric"
        x      = 0
        y      = 21
        width  = 8
        height = 6
        properties = {
          title  = "DynamoDB — Consumed Read Capacity"
          view   = "timeSeries"
          region = var.aws_region
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.products.name],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.carts.name],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.orders.name],
          ]
        }
      },

      {
        type   = "metric"
        x      = 8
        y      = 21
        width  = 8
        height = 6
        properties = {
          title  = "DynamoDB — Consumed Write Capacity"
          view   = "timeSeries"
          region = var.aws_region
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.products.name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.carts.name],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", aws_dynamodb_table.orders.name],
          ]
        }
      },

      {
        type   = "metric"
        x      = 16
        y      = 21
        width  = 8
        height = 6
        properties = {
          title  = "DynamoDB — Throttle Events"
          view   = "timeSeries"
          region = var.aws_region
          period = 60
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ReadThrottleEvents",  "TableName", aws_dynamodb_table.products.name],
            ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", aws_dynamodb_table.products.name],
            ["AWS/DynamoDB", "ReadThrottleEvents",  "TableName", aws_dynamodb_table.orders.name],
            ["AWS/DynamoDB", "WriteThrottleEvents", "TableName", aws_dynamodb_table.orders.name],
          ]
        }
      },

      {
        type   = "text"
        x      = 0
        y      = 27
        width  = 24
        height = 1
        properties = { markdown = "## ☁️ CloudFront" }
      },

      {
        type   = "metric"
        x      = 0
        y      = 28
        width  = 8
        height = 6
        properties = {
          title   = "CloudFront — Requests"
          view    = "timeSeries"
          region  = "us-east-1"
          period  = 60
          stat    = "Sum"
          metrics = [["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.frontend.id, "Region", "Global"]]
        }
      },

      {
        type   = "metric"
        x      = 8
        y      = 28
        width  = 8
        height = 6
        properties = {
          title   = "CloudFront — Cache Hit Ratio (%)"
          view    = "timeSeries"
          region  = "us-east-1"
          period  = 60
          stat    = "Average"
          metrics = [["AWS/CloudFront", "CacheHitRate", "DistributionId", aws_cloudfront_distribution.frontend.id, "Region", "Global"]]
        }
      },

      {
        type   = "metric"
        x      = 16
        y      = 28
        width  = 8
        height = 6
        properties = {
          title   = "CloudFront — Bytes Downloaded"
          view    = "timeSeries"
          region  = "us-east-1"
          period  = 60
          stat    = "Sum"
          metrics = [["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.frontend.id, "Region", "Global"]]
        }
      },

      {
        type   = "metric"
        x      = 0
        y      = 34
        width  = 8
        height = 6
        properties = {
          title   = "CloudFront — Error Rate (%)"
          view    = "timeSeries"
          region  = "us-east-1"
          period  = 60
          stat    = "Average"
          metrics = [["AWS/CloudFront", "TotalErrorRate", "DistributionId", aws_cloudfront_distribution.frontend.id, "Region", "Global"]]
        }
      },

    ]
  })
}
