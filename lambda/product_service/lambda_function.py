import json
import boto3
import uuid
import os
from decimal import Decimal
from shared.logger import get_logger

logger = get_logger('product_service')

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


# =========================================================
# 🔥 Normalize route
# =========================================================
def normalize_route(route):
    if not route:
        return route

    parts = route.split(" ", 1)

    if len(parts) != 2:
        return route

    method, path = parts
    path_parts = path.split("/", 2)

    if len(path_parts) > 2:
        path = "/" + path_parts[2]
    else:
        path = "/"

    return f"{method} {path}"


# =========================================================

def get_all_products():
    logger.info("Fetching all products")

    result = table.scan()
    items = result.get("Items", [])

    while "LastEvaluatedKey" in result:
        result = table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        items.extend(result.get("Items", []))

    logger.info("Products fetched", count=len(items))

    return response(200, {"products": items, "count": len(items)})


def get_product(product_id):
    logger.info("Fetching product", product_id=product_id)

    result = table.get_item(Key={"product_id": product_id})
    item = result.get("Item")

    if not item:
        logger.warning("Product not found", product_id=product_id)
        return response(404, {"message": "Product not found"})

    logger.info("Product fetched successfully", product_id=product_id)
    return response(200, item)


def create_product(body):
    logger.info("Creating product", product_name=body.get("name"))

    required = ["name", "description", "price", "stock", "image_url"]
    for field in required:
        if field not in body:
            logger.warning("Missing field in request", field=field)
            return response(400, {"message": f"Missing field: {field}"})

    product_id = str(uuid.uuid4())

    item = {
        "product_id": product_id,
        "name": body["name"],
        "description": body["description"],
        "price": Decimal(str(body["price"])),
        "stock": int(body["stock"]),
        "image_url": body["image_url"],
        "category": body.get("category", "")
    }

    table.put_item(Item=item)

    logger.info("Product created", product_id=product_id)

    return response(201, {"message": "Product created", "product_id": product_id})


def update_product(product_id, body):
    logger.info("Updating product", product_id=product_id)

    existing = table.get_item(Key={"product_id": product_id}).get("Item")

    if not existing:
        logger.warning("Product not found for update", product_id=product_id)
        return response(404, {"message": "Product not found"})

    allowed = ["name", "description", "price", "stock", "image_url", "category"]
    update_fields = {k: v for k, v in body.items() if k in allowed}

    if not update_fields:
        logger.warning("No valid fields to update", product_id=product_id)
        return response(400, {"message": "No valid fields to update"})

    if "price" in update_fields:
        update_fields["price"] = Decimal(str(update_fields["price"]))

    update_expression = "SET " + ", ".join(f"#f_{k} = :{k}" for k in update_fields)
    expression_names = {f"#f_{k}": k for k in update_fields}
    expression_values = {f":{k}": v for k, v in update_fields.items()}

    table.update_item(
        Key={"product_id": product_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_names,
        ExpressionAttributeValues=expression_values
    )

    logger.info("Product updated", product_id=product_id)

    return response(200, {"message": "Product updated", "product_id": product_id})


def delete_product(product_id):
    logger.info("Deleting product", product_id=product_id)

    existing = table.get_item(Key={"product_id": product_id}).get("Item")

    if not existing:
        logger.warning("Product not found for deletion", product_id=product_id)
        return response(404, {"message": "Product not found"})

    table.delete_item(Key={"product_id": product_id})

    logger.info("Product deleted", product_id=product_id)

    return response(200, {"message": "Product deleted", "product_id": product_id})


def lambda_handler(event, context):
    logger.info(
        "Request received",
        route=event.get("routeKey"),
        request_id=context.aws_request_id
    )

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

    route = event.get("routeKey", "")
    route = normalize_route(route)

    path_params = event.get("pathParameters") or {}
    product_id = path_params.get("product_id", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            logger.error("Invalid JSON body", request_id=context.aws_request_id)
            return response(400, {"message": "Invalid JSON body"})

    try:
        if route == "GET /":
            return response(200, {"message": "Product Service ✅", "status": "running"})

        elif route == "GET /products":
            return get_all_products()

        elif route == "GET /products/{product_id}":
            return get_product(product_id)

        elif route == "POST /products":
            return create_product(body)

        elif route == "PUT /products/{product_id}":
            return update_product(product_id, body)

        elif route == "DELETE /products/{product_id}":
            return delete_product(product_id)

        else:
            logger.warning("Route not found", route=route)
            return response(404, {"message": f"Route not found: {route}"})

    except Exception as e:
        logger.error(
            "Unhandled error in product service",
            error=str(e),
            route=route,
            request_id=context.aws_request_id
        )
        return response(500, {"message": "Internal server error"})