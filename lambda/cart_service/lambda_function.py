import json
import boto3
import os
import urllib.request
from decimal import Decimal
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
CART_TABLE = os.environ.get("CART_TABLE", "ecommerce-carts")
PRODUCT_SERVICE_URL = os.environ.get("PRODUCT_SERVICE_URL", "")
table = dynamodb.Table(CART_TABLE)


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


def fetch_product(product_id):
    try:
        url = f"{PRODUCT_SERVICE_URL}/products/{product_id}"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                return json.loads(res.read().decode())
            return None
    except Exception as e:
        print(f"Error fetching product: {e}")
        return None


def add_to_cart(body):
    required = ["user_id", "product_id", "quantity"]
    for field in required:
        if field not in body:
            return response(400, {"message": f"Missing field: {field}"})
    user_id = body["user_id"]
    product_id = body["product_id"]
    quantity = int(body["quantity"])
    product = fetch_product(product_id)
    if not product:
        return response(404, {"message": "Product not found"})
    available_stock = int(product.get("stock", 0))
    if quantity > available_stock:
        return response(400, {"message": f"Not enough stock. Available: {available_stock}"})
    existing = table.get_item(
        Key={"user_id": user_id, "product_id": product_id}
    ).get("Item")
    if existing:
        new_qty = int(existing["quantity"]) + quantity
        table.update_item(
            Key={"user_id": user_id, "product_id": product_id},
            UpdateExpression="SET quantity = :q",
            ExpressionAttributeValues={":q": new_qty}
        )
        return response(200, {"message": "Quantity updated", "new_quantity": new_qty})
    else:
        table.put_item(Item={
            "user_id": user_id,
            "product_id": product_id,
            "quantity": quantity,
            "name": product.get("name", ""),
            "price": Decimal(str(product.get("price", 0)))
        })
        return response(200, {"message": "Item added to cart"})


def get_cart(user_id):
    result = table.query(KeyConditionExpression=Key("user_id").eq(user_id))
    items = result.get("Items", [])
    enriched = []
    for item in items:
        price = float(item.get("price", 0))
        qty = int(item.get("quantity", 1))
        enriched.append({
            "product_id": item["product_id"],
            "name": item.get("name", ""),
            "price": price,
            "quantity": qty,
            "total_price": round(price * qty, 2)
        })
    cart_total = round(sum(i["total_price"] for i in enriched), 2)
    return response(200, {
        "user_id": user_id,
        "items": enriched,
        "cart_total": cart_total,
        "item_count": len(enriched)
    })


def remove_item(user_id, product_id):
    existing = table.get_item(
        Key={"user_id": user_id, "product_id": product_id}
    ).get("Item")
    if not existing:
        return response(404, {"message": "Item not found in cart"})
    table.delete_item(Key={"user_id": user_id, "product_id": product_id})
    return response(200, {"message": "Item removed from cart"})


def clear_cart(user_id):
    result = table.query(KeyConditionExpression=Key("user_id").eq(user_id))
    items = result.get("Items", [])
    if not items:
        return response(200, {"message": "Cart is already empty"})
    with table.batch_writer() as batch:
        for item in items:
            batch.delete_item(Key={"user_id": item["user_id"], "product_id": item["product_id"]})
    return response(200, {"message": "Cart cleared", "items_removed": len(items)})


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

    route = event.get("routeKey", "")
    path_params = event.get("pathParameters") or {}
    user_id = path_params.get("user_id", "")
    product_id = path_params.get("product_id", "")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return response(400, {"message": "Invalid JSON body"})

    if route == "GET /":
        return response(200, {"message": "Cart Service 🛒", "status": "running"})
    elif route == "POST /cart":
        return add_to_cart(body)
    elif route == "GET /cart/{user_id}":
        return get_cart(user_id)
    elif route == "DELETE /cart/{user_id}/{product_id}":
        return remove_item(user_id, product_id)
    elif route == "DELETE /cart/{user_id}":
        return clear_cart(user_id)
    else:
        return response(404, {"message": f"Route not found: {route}"})