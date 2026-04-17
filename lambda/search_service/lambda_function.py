import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource("dynamodb")
TABLE_NAME = os.environ.get("PRODUCTS_TABLE", "ecommerce-products")
table = dynamodb.Table(TABLE_NAME)


def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        },
        "body": json.dumps(body, default=decimal_to_float)
    }


def search_products(keyword, min_price=None, max_price=None):
    result = table.scan()
    items = result.get("Items", [])
    while "LastEvaluatedKey" in result:
        result = table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        items.extend(result.get("Items", []))
    filtered = []
    keyword_lower = keyword.lower() if keyword else ""
    for item in items:
        name = item.get("name", "").lower()
        description = item.get("description", "").lower()
        if keyword_lower and keyword_lower not in name \
                and keyword_lower not in description:
            continue
        price = float(item.get("price", 0))
        if min_price is not None and price < min_price:
            continue
        if max_price is not None and price > max_price:
            continue
        filtered.append(item)
    return filtered


def lambda_handler(event, context):
    print("Event:", json.dumps(event))

    try:
        method = event.get("requestContext", {}).get("http", {}).get("method", "")
    except Exception:
        method = ""

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type,Authorization"
            },
            "body": ""
        }

    route        = event.get("routeKey", "")
    query_params = event.get("queryStringParameters") or {}

    if route == "GET /":
        return response(200, {"message": "Search Service 🔍", "status": "running"})
    elif route == "GET /search":
        keyword   = query_params.get("q", "")
        min_price = float(query_params["min_price"]) if "min_price" in query_params else None
        max_price = float(query_params["max_price"]) if "max_price" in query_params else None
        results = search_products(keyword, min_price, max_price)
        return response(200, {
            "query": {"keyword": keyword, "min_price": min_price, "max_price": max_price},
            "count": len(results),
            "products": results
        })
    else:
        return response(404, {"message": f"Route not found: {route}"})