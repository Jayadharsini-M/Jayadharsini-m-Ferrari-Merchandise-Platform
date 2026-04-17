import json
import boto3
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# ── Logging ────────────────────────────────────────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ── DynamoDB setup ─────────────────────────────────────────────────────────
dynamodb = boto3.resource("dynamodb")

ORDERS_TABLE   = os.environ.get("ORDERS_TABLE",      "dev-ferrari-orders")
PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE",    "dev-ferrari-products")
CART_TABLE     = os.environ.get("CART_TABLE",        "dev-ferrari-carts")
STRIPE_KEY     = os.environ.get("STRIPE_SECRET_KEY", "")

orders_table   = dynamodb.Table(ORDERS_TABLE)
products_table = dynamodb.Table(PRODUCTS_TABLE)
cart_table     = dynamodb.Table(CART_TABLE)


# ══════════════════════════════════════════════════════════════════════════
# HELPERS — defined FIRST so every function below can use them
# ══════════════════════════════════════════════════════════════════════════

class DecimalEncoder(json.JSONEncoder):
    """Handle DynamoDB Decimal type in JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def decimal_to_float(obj):
    """Recursively convert Decimal in nested dicts/lists."""
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    if isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return float(obj)
    return obj


def api_response(status_code, body):
    """Standard API response with CORS headers."""
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
    return api_response(status_code, {"success": True,  **data})


def error(message, status_code=400, details=None):
    body = {"success": False, "message": message}
    if details:
        body["details"] = str(details)
    return api_response(status_code, body)


def get_timestamp():
    return datetime.now(timezone.utc).isoformat()


# ══════════════════════════════════════════════════════════════════════════
# ROUTE HANDLERS — defined AFTER helpers
# ══════════════════════════════════════════════════════════════════════════

def process_payment(body):
    """
    POST /payment
    Accepts: user_id, order_id, stripe_token, amount
    Simulates Stripe charge and marks order as paid.
    """
    user_id      = (body.get("user_id")      or "").strip()
    order_id     = (body.get("order_id")     or "").strip()
    stripe_token = (body.get("stripe_token") or "").strip()
    amount       = body.get("amount", 0)

    logger.info("process_payment called: user=%s order=%s amount=%s",
                user_id, order_id, amount)

    # ── Validate inputs ────────────────────────────────────────────────────
    if not user_id:
        return error("Missing user_id")
    if not order_id:
        return error("Missing order_id")
    if not stripe_token:
        return error("Missing stripe_token")
    if not amount or float(amount) <= 0:
        return error("Invalid amount")

    # ── Fetch order ────────────────────────────────────────────────────────
    try:
        result = orders_table.get_item(Key={"order_id": order_id})
        order  = result.get("Item")
    except Exception as e:
        logger.error("DynamoDB get_item failed: %s", str(e))
        return error("Failed to fetch order", 500)

    if not order:
        return error(f"Order not found: {order_id}", 404)
    if order.get("user_id") != user_id:
        return error("Not authorized to pay for this order", 403)
    if order.get("status") != "confirmed":
        return error(
            f"Order cannot be paid. Current status: {order.get('status')}",
            400
        )

    # ── Stripe charge ──────────────────────────────────────────────────────
    payment_id = None

    if STRIPE_KEY and not stripe_token.startswith("tok_simulated"):
        # Real Stripe charge
        try:
            import stripe
            stripe.api_key = STRIPE_KEY

            charge = stripe.Charge.create(
                amount      = int(float(amount) * 100),
                currency    = "usd",
                source      = stripe_token,
                description = f"Ferrari Store — Order {order_id}",
            )

            if charge["status"] != "succeeded":
                return error("Payment declined. Please try again.", 402)

            payment_id = charge["id"]
            logger.info("Stripe charge succeeded: %s", payment_id)

        except Exception as e:
            logger.error("Stripe error: %s", str(e))
            return error("Payment failed. Please check your card details.", 402)

    else:
        # Simulated payment (no real Stripe key or simulated token)
        payment_id = f"sim_{order_id[:8]}_{int(datetime.now().timestamp())}"
        logger.info("Simulated payment: %s", payment_id)

    # ── Update order to 'paid' ─────────────────────────────────────────────
    timestamp = get_timestamp()
    try:
        orders_table.update_item(
            Key={"order_id": order_id},
            UpdateExpression="SET #st = :paid, updated_at = :ts, payment_id = :pid",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={
                ":paid": "paid",
                ":ts":   timestamp,
                ":pid":  payment_id,
            },
        )
        logger.info("Order %s marked as paid", order_id)
    except Exception as e:
        logger.error("DynamoDB update_item failed: %s", str(e))
        return error("Payment processed but failed to update order. Contact support.", 500)

    return success({
        "message":    "Payment successful! 🏎️",
        "payment_id": payment_id,
        "order_id":   order_id,
        "amount":     float(amount),
        "paid_at":    timestamp,
    })


# ══════════════════════════════════════════════════════════════════════════
# MAIN HANDLER
# ══════════════════════════════════════════════════════════════════════════

def lambda_handler(event, context):
    logger.info("Payment Lambda event: %s", json.dumps(event, default=str))

    route = event.get("routeKey", "")
    body  = {}

    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return error("Invalid JSON body", 400)

    logger.info("Route: '%s'", route)

    if route == "GET /":
        return success({"message": "Ferrari Payment Service 💳", "status": "running"})

    elif route == "GET /payment":
        return success({"message": "Ferrari Payment Service 💳", "status": "running"})

    elif route == "POST /payment":
        return process_payment(body)

    elif route.startswith("OPTIONS"):
        return api_response(200, {"message": "OK"})

    else:
        logger.warning("No route matched: '%s'", route)
        return error(f"Route not found: {route}", 404)