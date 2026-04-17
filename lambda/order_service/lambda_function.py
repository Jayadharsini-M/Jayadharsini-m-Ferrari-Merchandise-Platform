import json
import boto3
import uuid
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from urllib.parse import unquote

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb        = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE", "dev-ferrari-products")
CART_TABLE     = os.environ.get("CART_TABLE",     "dev-ferrari-carts")
ORDERS_TABLE   = os.environ.get("ORDERS_TABLE",   "dev-ferrari-orders")

products_table = dynamodb.Table(PRODUCTS_TABLE)
cart_table     = dynamodb.Table(CART_TABLE)
orders_table   = dynamodb.Table(ORDERS_TABLE)

CANCELLABLE_STATUSES = {"confirmed"}


# ══════════════════════════════════════════════════════
# FIX 1 — Custom JSON encoder handles Decimal anywhere
# ══════════════════════════════════════════════════════
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


# ══════════════════════════════════════════════════════
# FIX 2 — Recursive Decimal converter for dicts/lists
# ══════════════════════════════════════════════════════
def decimal_to_float(obj):
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    if isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return float(obj)
    return obj


def api_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type":                 "application/json",
            "Access-Control-Allow-Origin":  "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(body, cls=DecimalEncoder),  # ← THE FIX
    }


def success(data, status_code=200):
    return api_response(status_code, {"success": True, **data})


def error(message, status_code=400, details=None):
    body = {"success": False, "message": message}
    if details:
        body["details"] = str(details)
    return api_response(status_code, body)


def get_timestamp():
    return datetime.now(timezone.utc).isoformat()


# ══════════════════════════════════════════════════════
# DB HELPERS
# ══════════════════════════════════════════════════════
def fetch_cart_items(user_id):
    result = cart_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id)
    )
    return result.get("Items", [])


def fetch_product(product_id):
    result = products_table.get_item(Key={"product_id": product_id})
    return result.get("Item")


def fetch_order(order_id):
    result = orders_table.get_item(Key={"order_id": order_id})
    return result.get("Item")


def fetch_user_orders(user_id):
    logger.info("Querying orders for user_id='%s' table='%s'", user_id, ORDERS_TABLE)
    result = orders_table.query(
        IndexName="user_id-created_at-index",
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False,
    )
    items = result.get("Items", [])
    logger.info("Found %d orders for '%s'", len(items), user_id)
    return items


def clear_user_cart(user_id, cart_items):
    with cart_table.batch_writer() as batch:
        for item in cart_items:
            batch.delete_item(
                Key={"user_id": user_id, "product_id": item["product_id"]}
            )


def parse_order_items(order):
    """items is stored as a JSON string in DynamoDB — parse it back to list."""
    raw = order.get("items", "[]")
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        logger.warning("Could not parse items for order %s", order.get("order_id"))
        return []


# ══════════════════════════════════════════════════════
# ROUTE HANDLERS
# ══════════════════════════════════════════════════════
def handle_place_order(body):
    user_id = (body.get("user_id") or "").strip()
    if not user_id:
        return error("Missing or empty field: user_id")

    cart_items = fetch_cart_items(user_id)
    if not cart_items:
        return error("Cart is empty. Add items before placing an order.")

    products     = {}
    out_of_stock = []
    for cart_item in cart_items:
        product_id = cart_item["product_id"]
        quantity   = int(cart_item["quantity"])
        product    = fetch_product(product_id)
        if not product:
            return error(f"Product not found: {product_id}", 404)
        available = int(product.get("stock", 0))
        if quantity > available:
            out_of_stock.append({
                "product_id": product_id,
                "name":       product.get("name", ""),
                "requested":  quantity,
                "available":  available,
            })
        products[product_id] = product

    if out_of_stock:
        return error("Some items are out of stock", 400, details=out_of_stock)

    order_id    = str(uuid.uuid4())
    timestamp   = get_timestamp()
    order_items = []
    order_total = Decimal("0")

    for cart_item in cart_items:
        product_id = cart_item["product_id"]
        quantity   = int(cart_item["quantity"])
        product    = products[product_id]
        price      = Decimal(str(product["price"]))
        item_total = price * quantity
        order_items.append({
            "product_id": product_id,
            "name":       product["name"],
            "quantity":   quantity,
            "price":      float(price),
            "item_total": float(item_total),
        })
        order_total += item_total

    transact_items = []
    for cart_item in cart_items:
        product_id = cart_item["product_id"]
        quantity   = int(cart_item["quantity"])
        transact_items.append({
            "Update": {
                "TableName": PRODUCTS_TABLE,
                "Key": {"product_id": {"S": product_id}},
                "UpdateExpression": "SET stock = stock - :qty",
                "ConditionExpression": "stock >= :qty",
                "ExpressionAttributeValues": {":qty": {"N": str(quantity)}},
            }
        })

    transact_items.append({
        "Put": {
            "TableName": ORDERS_TABLE,
            "Item": {
                "order_id":    {"S": order_id},
                "user_id":     {"S": user_id},
                "items":       {"S": json.dumps(order_items)},
                "order_total": {"N": str(order_total)},
                "status":      {"S": "confirmed"},
                "created_at":  {"S": timestamp},
                "updated_at":  {"S": timestamp},
            },
        }
    })

    try:
        dynamodb_client.transact_write_items(TransactItems=transact_items)
    except dynamodb_client.exceptions.TransactionCanceledException as e:
        return error("Order failed due to stock conflict. Please try again.", 409, details=str(e))
    except Exception as e:
        logger.error("place_order failed: %s", str(e))
        return error("Order could not be placed. Please try again.", 500)

    clear_user_cart(user_id, cart_items)

    return success({
        "message":     "Order placed successfully! 🏎️",
        "order_id":    order_id,
        "user_id":     user_id,
        "status":      "confirmed",
        "created_at":  timestamp,
        "items":       order_items,
        "order_total": float(order_total),
        "item_count":  len(order_items),
    }, status_code=201)


def handle_cancel_order(body):
    order_id = (body.get("order_id") or "").strip()
    user_id  = (body.get("user_id")  or "").strip()

    if not order_id:
        return error("Missing or empty field: order_id")
    if not user_id:
        return error("Missing or empty field: user_id")

    order = fetch_order(order_id)
    if not order:
        return error(f"Order not found: {order_id}", 404)
    if order.get("user_id") != user_id:
        return error("You are not authorized to cancel this order.", 403)

    current_status = order.get("status", "")
    if current_status == "cancelled":
        return error("Order is already cancelled.", 400)
    if current_status not in CANCELLABLE_STATUSES:
        return error(f"Order cannot be cancelled. Current status: '{current_status}'.", 400)

    order_items = parse_order_items(order)
    timestamp   = get_timestamp()

    transact_items = []
    for item in order_items:
        transact_items.append({
            "Update": {
                "TableName": PRODUCTS_TABLE,
                "Key": {"product_id": {"S": item["product_id"]}},
                "UpdateExpression": "SET stock = stock + :qty",
                "ExpressionAttributeValues": {":qty": {"N": str(int(item["quantity"]))}},
            }
        })

    transact_items.append({
        "Update": {
            "TableName": ORDERS_TABLE,
            "Key": {"order_id": {"S": order_id}},
            "UpdateExpression": "SET #st = :cancelled, updated_at = :ts",
            "ConditionExpression": "#st = :current_status",
            "ExpressionAttributeNames": {"#st": "status"},
            "ExpressionAttributeValues": {
                ":cancelled":      {"S": "cancelled"},
                ":current_status": {"S": current_status},
                ":ts":             {"S": timestamp},
            },
        }
    })

    try:
        dynamodb_client.transact_write_items(TransactItems=transact_items)
    except dynamodb_client.exceptions.TransactionCanceledException as e:
        return error("Cancellation failed. Order may have already been cancelled.", 409, details=str(e))
    except Exception as e:
        logger.error("cancel_order failed: %s", str(e))
        return error("Cancellation could not be processed. Please try again.", 500)

    return success({
        "message":        "Order cancelled successfully.",
        "order_id":       order_id,
        "user_id":        user_id,
        "status":         "cancelled",
        "cancelled_at":   timestamp,
        "items_restored": [
            {"product_id": i["product_id"], "name": i["name"], "quantity": i["quantity"]}
            for i in order_items
        ],
    })


def handle_get_user_orders(path_params):
    raw_user_id = path_params.get("user_id", "")
    user_id     = unquote(str(raw_user_id)).strip()

    logger.info("GET /orders/{user_id} → user_id='%s'", user_id)

    if not user_id:
        return error("Missing user_id", 400)

    try:
        orders = fetch_user_orders(user_id)
    except Exception as e:
        logger.error("fetch_user_orders failed: %s", str(e))
        return error(f"Failed to fetch orders: {str(e)}", 500)

    normalized = []
    for order in orders:
        # convert ALL Decimals recursively before touching items
        o = decimal_to_float(dict(order))
        o["items"] = parse_order_items(o)   # parse JSON string → list
        normalized.append(o)

    return success({
        "user_id": user_id,
        "orders":  normalized,
        "count":   len(normalized),
    })


def handle_get_single_order(path_params, query_params):
    order_id = (path_params.get("order_id") or "").strip()
    user_id  = (query_params.get("user_id")  or "").strip()

    if not order_id:
        return error("Missing order_id", 400)
    if not user_id:
        return error("Missing query parameter: user_id", 400)

    order = fetch_order(order_id)
    if not order:
        return error(f"Order not found: {order_id}", 404)
    if order.get("user_id") != user_id:
        return error("Not authorized to view this order.", 403)

    order = decimal_to_float(dict(order))
    order["items"] = parse_order_items(order)

    return success({"order": order})


# ══════════════════════════════════════════════════════
# MAIN HANDLER
# ══════════════════════════════════════════════════════
def lambda_handler(event, context):
    logger.info("Event: %s", json.dumps(event, default=str))

    route        = event.get("routeKey", "")
    path_params  = event.get("pathParameters")        or {}
    query_params = event.get("queryStringParameters") or {}

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return error("Invalid JSON body", 400)

    logger.info("Route='%s' pathParams=%s queryParams=%s", route, path_params, query_params)

    if route == "GET /":
        return success({"message": "Ferrari Order Service 📦🏎️", "status": "running"})
    elif route == "POST /order":
        return handle_place_order(body)
    elif route == "POST /cancel-order":
        return handle_cancel_order(body)
    elif route == "GET /orders/{user_id}":
        return handle_get_user_orders(path_params)
    elif route == "GET /order/{order_id}":
        return handle_get_single_order(path_params, query_params)
    elif route.startswith("OPTIONS"):
        return api_response(200, {"message": "OK"})
    else:
        logger.warning("No route matched: '%s'", route)
        return error(f"Route not found: {route}", 404)