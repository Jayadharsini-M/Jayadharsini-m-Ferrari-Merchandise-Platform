import json
import sys
import os
from moto import mock_aws

ORDER_SERVICE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../lambda/order_service")
)

from tests.backend.conftest import clean_lambda_import


def make_event(route, body=None, path_params=None, query_params=None):
    return {
        "routeKey": route,
        "pathParameters": path_params or {},
        "queryStringParameters": query_params or {},
        "body": json.dumps(body) if body else None,
    }


def get_lambda():
    clean_lambda_import()
    if ORDER_SERVICE_PATH not in sys.path:
        sys.path.insert(0, ORDER_SERVICE_PATH)
    import lambda_function
    return lambda_function


# ═══════════════════════════════════════════════════════════════════════
# PLACE ORDER
# ═══════════════════════════════════════════════════════════════════════

@mock_aws
def test_place_order_success(dynamodb_tables, seed_product, seed_cart):
    lf = get_lambda()

    seed_product(dynamodb_tables)
    seed_cart(dynamodb_tables)

    res = lf.lambda_handler(
        make_event("POST /order", body={"user_id": "user_001"}), {}
    )
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 201
    assert body["success"] is True
    assert body["status"] == "confirmed"
    assert "order_id" in body


@mock_aws
def test_place_order_empty_cart(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(
        make_event("POST /order", body={"user_id": "user_001"}), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False


@mock_aws
def test_place_order_missing_user_id(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(
        make_event("POST /order", body={}), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False


@mock_aws
def test_place_order_out_of_stock(dynamodb_tables, seed_product, seed_cart):
    lf = get_lambda()

    seed_product(dynamodb_tables, stock=0)
    seed_cart(dynamodb_tables, quantity=2)

    res = lf.lambda_handler(
        make_event("POST /order", body={"user_id": "user_001"}), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False


# ═══════════════════════════════════════════════════════════════════════
# GET ORDERS
# ═══════════════════════════════════════════════════════════════════════

@mock_aws
def test_get_user_orders_success(dynamodb_tables, seed_order):
    lf = get_lambda()

    seed_order(dynamodb_tables)

    res = lf.lambda_handler(
        make_event("GET /orders/{user_id}", path_params={"user_id": "user_001"}), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 200
    assert body["success"] is True
    assert body["count"] == 1


@mock_aws
def test_get_user_orders_empty(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(
        make_event("GET /orders/{user_id}", path_params={"user_id": "user_nobody"}), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 200
    assert body["count"] == 0
    assert body["orders"] == []


# ═══════════════════════════════════════════════════════════════════════
# CANCEL ORDER
# ═══════════════════════════════════════════════════════════════════════

@mock_aws
def test_cancel_order_success(dynamodb_tables, seed_product, seed_order):
    lf = get_lambda()

    seed_product(dynamodb_tables)
    seed_order(dynamodb_tables)

    res = lf.lambda_handler(
        make_event("POST /cancel-order", body={
            "order_id": "order_001",
            "user_id": "user_001"
        }), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 200
    assert body["success"] is True


@mock_aws
def test_cancel_order_wrong_user(dynamodb_tables, seed_order):
    lf = get_lambda()

    seed_order(dynamodb_tables)

    res = lf.lambda_handler(
        make_event("POST /cancel-order", body={
            "order_id": "order_001",
            "user_id": "user_hacker"
        }), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 403
    assert body["success"] is False


@mock_aws
def test_cancel_already_cancelled_order(dynamodb_tables, seed_order):
    lf = get_lambda()

    seed_order(dynamodb_tables, status="cancelled")

    res = lf.lambda_handler(
        make_event("POST /cancel-order", body={
            "order_id": "order_001",
            "user_id": "user_001"
        }), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False


@mock_aws
def test_cancel_order_not_found(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(
        make_event("POST /cancel-order", body={
            "order_id": "order_fake",
            "user_id": "user_001"
        }), {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 404
    assert body["success"] is False