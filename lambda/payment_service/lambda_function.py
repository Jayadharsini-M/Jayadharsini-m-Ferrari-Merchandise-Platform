import json
import boto3
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal
from boto3.dynamodb.conditions import Key
from shared.logger import get_logger  # ✅ NEW

# ── Logging ────────────────────────────────────────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ✅ Structured Logger (NEW — DOES NOT REPLACE OLD ONE)
structured_logger = get_logger("payment_service")

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
# HELPERS
# ══════════════════════════════════════════════════════════════════════════

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
    return api_response(status_code, {"success": True,  **data})


def error(message, status_code=400, details=None):
    body = {"success": False, "message": message}
    if details:
        body["details"] = str(details)
    return api_response(status_code, body)


def get_timestamp():
    return datetime.now(timezone.utc).isoformat()


# ══════════════════════════════════════════════════════════════════════════
# ROUTE HANDLERS
# ══════════════════════════════════════════════════════════════════════════

def process_payment(body, context=None):
    user_id      = (body.get("user_id")      or "").strip()
    order_id     = (body.get("order_id")     or "").strip()
    stripe_token = (body.get("stripe_token") or "").strip()
    amount       = body.get("amount", 0)

    # ✅ Structured log
    structured_logger.info(
        "Payment initiated",
        user_id=user_id,
        order_id=order_id,
        amount=amount,
        request_id=context.aws_request_id if context else None
    )

    logger.info("process_payment called: user=%s order=%s amount=%s",
                user_id, order_id, amount)

    if not user_id:
        return error("Missing user_id")
    if not order_id:
        return error("Missing order_id")
    if not stripe_token:
        return error("Missing stripe_token")
    if not amount or float(amount) <= 0:
        return error("Invalid amount")

    try:
        result = orders_table.get_item(Key={"order_id": order_id})
        order  = result.get("Item")

        structured_logger.debug(
            "Fetched order from DB",
            order_id=order_id
        )

    except Exception as e:
        logger.error("DynamoDB get_item failed: %s", str(e))
        structured_logger.error(
            "DynamoDB fetch failed",
            error=e,
            order_id=order_id,
            user_id=user_id
        )
        return error("Failed to fetch order", 500)

    if not order:
        structured_logger.warning(
            "Order not found",
            order_id=order_id,
            user_id=user_id
        )
        return error(f"Order not found: {order_id}", 404)

    if order.get("user_id") != user_id:
        structured_logger.warning(
            "Unauthorized payment attempt",
            order_id=order_id,
            user_id=user_id
        )
        return error("Not authorized to pay for this order", 403)

    if order.get("status") != "confirmed":
        structured_logger.warning(
            "Invalid order state for payment",
            order_id=order_id,
            status=order.get("status")
        )
        return error(
            f"Order cannot be paid. Current status: {order.get('status')}",
            400
        )

    payment_id = None

    if STRIPE_KEY and not stripe_token.startswith("tok_simulated"):
        try:
            import stripe
            stripe.api_key = STRIPE_KEY

            structured_logger.debug(
                "Calling Stripe API",
                order_id=order_id,
                amount=amount
            )

            charge = stripe.Charge.create(
                amount      = int(float(amount) * 100),
                currency    = "usd",
                source      = stripe_token,
                description = f"Ferrari Store — Order {order_id}",
            )

            if charge["status"] != "succeeded":
                structured_logger.warning(
                    "Stripe payment failed",
                    order_id=order_id,
                    status=charge["status"]
                )
                return error("Payment declined. Please try again.", 402)

            payment_id = charge["id"]

            structured_logger.info(
                "Payment succeeded",
                order_id=order_id,
                payment_id=payment_id,
                amount=amount
            )

            logger.info("Stripe charge succeeded: %s", payment_id)

        except Exception as e:
            logger.error("Stripe error: %s", str(e))
            structured_logger.error(
                "Stripe error",
                error=e,
                order_id=order_id
            )
            return error("Payment failed. Please check your card details.", 402)

    else:
        payment_id = f"sim_{order_id[:8]}_{int(datetime.now().timestamp())}"

        structured_logger.info(
            "Simulated payment success",
            order_id=order_id,
            payment_id=payment_id
        )

        logger.info("Simulated payment: %s", payment_id)

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

        structured_logger.info(
            "Order marked as paid",
            order_id=order_id,
            payment_id=payment_id
        )

        logger.info("Order %s marked as paid", order_id)

    except Exception as e:
        logger.error("DynamoDB update_item failed: %s", str(e))

        structured_logger.critical(
            "Payment succeeded but DB update failed",
            error=e,
            order_id=order_id,
            payment_id=payment_id
        )

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

    structured_logger.info(
        "Lambda invoked",
        route=event.get("routeKey"),
        request_id=context.aws_request_id
    )

    route = event.get("routeKey", "")

    if route.startswith("GET /v1"):
        route = route.replace("/v1", "", 1)
    elif route.startswith("POST /v1"):
        route = route.replace("/v1", "", 1)

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
        return process_payment(body, context)  # ✅ context passed
    elif route.startswith("OPTIONS"):
        return api_response(200, {"message": "OK"})
    else:
        logger.warning("No route matched: '%s'", route)

        structured_logger.warning(
            "Route not found",
            route=route
        )

        return error(f"Route not found: {route}", 404)