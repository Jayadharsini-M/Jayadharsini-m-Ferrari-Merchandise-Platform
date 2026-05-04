import json
import boto3
import uuid
import os
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from urllib.parse import unquote
from shared.logger import get_logger

logger = get_logger('order_service')

dynamodb        = boto3.resource("dynamodb")
dynamodb_client = boto3.client("dynamodb")

PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE", "dev-ferrari-products")
CART_TABLE     = os.environ.get("CART_TABLE",     "dev-ferrari-carts")
ORDERS_TABLE   = os.environ.get("ORDERS_TABLE",   "dev-ferrari-orders")

products_table = dynamodb.Table(PRODUCTS_TABLE)
cart_table     = dynamodb.Table(CART_TABLE)
orders_table   = dynamodb.Table(ORDERS_TABLE)

CANCELLABLE_STATUSES = {"confirmed"}


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


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
        "body": json.dumps(body, cls=DecimalEncoder),
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


# ── HELPERS ──────────────────────────────────────────────────────────────

def fetch_cart_items(user_id):
    return cart_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id)
    ).get("Items", [])


def fetch_product(product_id):
    return products_table.get_item(Key={"product_id": product_id}).get("Item")


def fetch_order(order_id):
    return orders_table.get_item(Key={"order_id": order_id}).get("Item")


def fetch_user_orders(user_id):
    logger.info("Fetching user orders", user_id=user_id)
    result = orders_table.query(
        IndexName="user_id-created_at-index",
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False,
    )
    items = result.get("Items", [])
    logger.info("Orders fetched", user_id=user_id, count=len(items))
    return items


def clear_user_cart(user_id, cart_items):
    logger.info("Clearing cart after order", user_id=user_id)
    with cart_table.batch_writer() as batch:
        for item in cart_items:
            batch.delete_item(
                Key={"user_id": user_id, "product_id": item["product_id"]}
            )


def parse_order_items(order):
    raw = order.get("items", "[]")
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw)
    except Exception:
        logger.warning("Failed to parse order items", order_id=order.get("order_id"))
        return []


# ─────────────────────────────────────────────────────────────────────────
# NEW HELPER: validate flash sale product before transact_write
# ─────────────────────────────────────────────────────────────────────────

def validate_flash_sale_product(product, quantity, correlation_id):
    """
    Extra guards specifically for is_flash_sale products:
    1. Drop must not be expired (drop_end_time check)
    2. Stock must cover the requested quantity (belt-and-suspenders before transaction)

    Returns (is_valid: bool, error_message: str | None)
    """
    product_name = product.get("name", product.get("product_id"))

    # Guard 1 — drop window expired
    drop_end_time = product.get("drop_end_time", "")
    if drop_end_time:
        try:
            end_dt = datetime.fromisoformat(drop_end_time.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > end_dt:
                logger.warning(
                    "Flash sale expired at order time",
                    product_id=product.get("product_id"),
                    drop_end_time=drop_end_time,
                    correlation_id=correlation_id
                )
                return False, (
                    f"'{product_name}' — this limited drop has ended. "
                    "Remove it from your cart to continue."
                )
        except ValueError:
            # Malformed timestamp — let the transaction be the final arbiter
            logger.warning(
                "Malformed drop_end_time, skipping expiry check",
                product_id=product.get("product_id"),
                correlation_id=correlation_id
            )

    # Guard 2 — pre-flight stock check (soft check; transaction is the hard lock)
    available = int(product.get("stock", 0))
    if quantity > available:
        logger.warning(
            "Flash sale product insufficient stock (pre-flight)",
            product_id=product.get("product_id"),
            requested=quantity,
            available=available,
            correlation_id=correlation_id
        )
        return False, (
            f"'{product_name}' only has {available} unit(s) left. "
            "Update your cart quantity."
        )

    return True, None


# ── ROUTES ───────────────────────────────────────────────────────────────

def handle_place_order(body, correlation_id):
    user_id = (body.get("user_id") or "").strip()

    logger.info("Placing order", user_id=user_id, correlation_id=correlation_id)

    if not user_id:
        return error("Missing or empty field: user_id")

    cart_items = fetch_cart_items(user_id)
    if not cart_items:
        logger.warning("Cart empty during order", user_id=user_id)
        return error("Cart is empty.")

    products      = {}
    out_of_stock  = []

    # ── Pre-flight validation loop ────────────────────────────────────────
    for cart_item in cart_items:
        product_id = cart_item["product_id"]
        quantity   = int(cart_item["quantity"])

        product = fetch_product(product_id)
        if not product:
            logger.warning("Product missing", product_id=product_id)
            return error(f"Product not found: {product_id}", 404)

        # ── FLASH SALE: extra guards before we even attempt the transaction ──
        if product.get("is_flash_sale"):
            valid, msg = validate_flash_sale_product(product, quantity, correlation_id)
            if not valid:
                return error(msg, 409)

        # Standard stock check (covers non-flash products too)
        available = int(product.get("stock", 0))
        if quantity > available:
            out_of_stock.append(product_id)

        products[product_id] = product

    if out_of_stock:
        logger.warning("Stock issue", products=out_of_stock, correlation_id=correlation_id)
        return error("Some items are out of stock", 400)

    # ── Build order payload ───────────────────────────────────────────────
    order_id    = str(uuid.uuid4())
    timestamp   = get_timestamp()
    order_total = Decimal("0")
    order_items = []

    for cart_item in cart_items:
        product_id = cart_item["product_id"]
        quantity   = int(cart_item["quantity"])
        product    = products[product_id]

        price      = Decimal(str(product["price"]))
        item_total = price * quantity

        order_items.append({
            "product_id":   product_id,
            "name":         product["name"],
            "quantity":     quantity,
            "price":        float(price),
            "item_total":   float(item_total),
            # ── Snapshot flash sale metadata into the order record ──
            "is_flash_sale": product.get("is_flash_sale", False),
            "flash_label":   product.get("flash_label", ""),
        })

        order_total += item_total

    # ── ATOMIC TRANSACTION ────────────────────────────────────────────────
    # Your existing transact_write already does stock -= qty with
    # ConditionExpression stock >= qty. This is the hard lock that prevents
    # overselling even if two requests pass the pre-flight check simultaneously.
    # No change needed to the transaction itself.
    try:
        dynamodb_client.transact_write_items(TransactItems=[
            *[
                {
                    "Update": {
                        "TableName": PRODUCTS_TABLE,
                        "Key": {"product_id": {"S": item["product_id"]}},
                        "UpdateExpression": "SET stock = stock - :qty",
                        # ConditionExpression is the atomic guard — race condition safe
                        "ConditionExpression": "stock >= :qty",
                        "ExpressionAttributeValues": {
                            ":qty": {"N": str(int(item["quantity"]))}
                        },
                    }
                }
                for item in cart_items
            ],
            {
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
            }
        ])

    except dynamodb_client.exceptions.TransactionCanceledException as e:
        # ── Decode which item caused the cancellation ─────────────────────
        reasons = e.response.get("CancellationReasons", [])
        failed_items = []

        for idx, reason in enumerate(reasons):
            # Last entry is the Order Put — skip it
            if reason.get("Code") == "ConditionalCheckFailed" and idx < len(cart_items):
                failed_product_id   = cart_items[idx]["product_id"]
                failed_product_name = products.get(failed_product_id, {}).get("name", failed_product_id)
                is_flash            = products.get(failed_product_id, {}).get("is_flash_sale", False)
                failed_items.append((failed_product_name, is_flash))

        if failed_items:
            name, is_flash = failed_items[0]
            if is_flash:
                msg = (
                    f"'{name}' just sold out during checkout. "
                    "Another customer claimed the last unit(s). Remove it from your cart."
                )
            else:
                msg = f"'{name}' is out of stock. Please update your cart."
            logger.warning(
                "Transaction cancelled — stock condition failed",
                failed=failed_items,
                correlation_id=correlation_id
            )
            return error(msg, 409)

        logger.error(
            "Transaction cancelled — unknown reason",
            reasons=str(reasons),
            correlation_id=correlation_id
        )
        return error("Order failed due to a conflict. Please try again.", 409)

    except Exception as e:
        logger.error("Transaction failed", error=str(e), correlation_id=correlation_id)
        return error("Order failed. Please try again.", 500)

    # ── Clear cart only after successful transaction ───────────────────────
    clear_user_cart(user_id, cart_items)

    logger.info(
        "Order created",
        order_id=order_id,
        total=float(order_total),
        correlation_id=correlation_id
    )

    return success({
        "message":     "Order placed successfully 🏎️",
        "order_id":    order_id,
        "user_id":     user_id,
        "order_total": float(order_total),
    }, 201)


# ── Remaining handlers — zero changes ────────────────────────────────────

def handle_cancel_order(body, correlation_id):
    order_id = (body.get("order_id") or "").strip()
    user_id  = (body.get("user_id")  or "").strip()

    logger.info("Cancelling order", order_id=order_id, user_id=user_id,
                correlation_id=correlation_id)

    if not order_id or not user_id:
        return error("Missing fields")

    order = fetch_order(order_id)
    if not order:
        return error("Order not found", 404)

    current_status = order.get("status", "")
    if current_status not in CANCELLABLE_STATUSES:
        return error("Cannot cancel order")

    timestamp = get_timestamp()

    try:
        dynamodb_client.update_item(
            TableName=ORDERS_TABLE,
            Key={"order_id": {"S": order_id}},
            UpdateExpression="SET #st = :cancelled, updated_at = :ts",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={
                ":cancelled": {"S": "cancelled"},
                ":ts":        {"S": timestamp}
            }
        )
    except Exception as e:
        logger.error("Cancel failed", error=str(e), correlation_id=correlation_id)
        return error("Cancel failed", 500)

    logger.info("Order cancelled", order_id=order_id, correlation_id=correlation_id)
    return success({"message": "Order cancelled", "order_id": order_id})


def handle_get_user_orders(path_params, correlation_id):
    user_id = unquote(str(path_params.get("user_id", ""))).strip()
    logger.info("Fetching orders", user_id=user_id, correlation_id=correlation_id)

    orders = fetch_user_orders(user_id)

    normalized = []
    for order in orders:
        o = decimal_to_float(dict(order))
        o["items"] = parse_order_items(o)
        normalized.append(o)

    return success({"orders": normalized, "count": len(normalized)})


def handle_get_single_order(path_params, query_params, correlation_id):
    order_id = (path_params.get("order_id") or "").strip()
    user_id  = (query_params.get("user_id")  or "").strip()

    logger.info("Fetching single order", order_id=order_id, correlation_id=correlation_id)

    order = fetch_order(order_id)
    if not order:
        return error("Order not found", 404)

    order = decimal_to_float(dict(order))
    order["items"] = parse_order_items(order)
    return success({"order": order})


# ── MAIN HANDLER ─────────────────────────────────────────────────────────

def lambda_handler(event, context):
    correlation_id = (event.get("headers") or {}).get(
        "X-Correlation-ID", str(uuid.uuid4())
    )

    logger.info(
        "Request received",
        route=event.get("routeKey"),
        request_id=context.aws_request_id,
        correlation_id=correlation_id
    )

    route        = event.get("routeKey", "")
    path_params  = event.get("pathParameters") or {}
    query_params = event.get("queryStringParameters") or {}

    if route.startswith("GET /v1"):
        route = route.replace("/v1", "", 1)
    elif route.startswith("POST /v1"):
        route = route.replace("/v1", "", 1)

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            logger.error("Invalid JSON", correlation_id=correlation_id)
            return error("Invalid JSON body", 400)

    try:
        if route == "GET /":
            return success({"message": "Ferrari Order Service 📦🏎️"})
        elif route == "POST /order":
            return handle_place_order(body, correlation_id)
        elif route == "POST /cancel-order":
            return handle_cancel_order(body, correlation_id)
        elif route == "GET /orders/{user_id}":
            return handle_get_user_orders(path_params, correlation_id)
        elif route == "GET /order/{order_id}":
            return handle_get_single_order(path_params, query_params, correlation_id)
        elif route.startswith("OPTIONS"):
            return api_response(200, {"message": "OK"})
        else:
            logger.warning("Route not found", route=route, correlation_id=correlation_id)
            return error(f"Route not found: {route}", 404)

    except Exception as e:
        logger.critical("Unhandled failure", error=str(e), correlation_id=correlation_id)
        return error("Internal server error", 500)