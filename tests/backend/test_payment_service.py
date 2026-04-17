import json
import sys
import os
from moto import mock_aws

PAYMENT_SERVICE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../lambda/payment_service")
)

from tests.backend.conftest import clean_lambda_import


def make_event(route, body=None):
    return {
        "routeKey": route,
        "body": json.dumps(body) if body else None,
    }


def get_lambda():
    clean_lambda_import()
    if PAYMENT_SERVICE_PATH not in sys.path:
        sys.path.insert(0, PAYMENT_SERVICE_PATH)
    import lambda_function
    return lambda_function


# ═══════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════

@mock_aws
def test_payment_health_check(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(
        {"routeKey": "GET /payment", "body": None}, {}
    )
    body = json.loads(res["body"])

    assert res["statusCode"] == 200
    assert body["success"] is True


# ═══════════════════════════════════════════════════════
# SUCCESS PAYMENT
# ═══════════════════════════════════════════════════════

@mock_aws
def test_payment_success_simulated(dynamodb_tables, seed_order):
    lf = get_lambda()

    seed_order(dynamodb_tables)

    res = lf.lambda_handler(make_event("POST /payment", body={
        "user_id": "user_001",
        "order_id": "order_001",
        "stripe_token": "tok_simulated_test",
        "amount": 99.98,
    }), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 200
    assert body["success"] is True
    assert "payment_id" in body
    assert body["amount"] == 99.98


# ═══════════════════════════════════════════════════════
# VALIDATION TESTS (NO FIX NEEDED HERE)
# ═══════════════════════════════════════════════════════

@mock_aws
def test_payment_missing_user_id(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(make_event("POST /payment", body={
        "order_id": "order_001",
        "stripe_token": "tok_simulated_test",
        "amount": 99.98,
    }), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False


@mock_aws
def test_payment_missing_order_id(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(make_event("POST /payment", body={
        "user_id": "user_001",
        "stripe_token": "tok_simulated_test",
        "amount": 99.98,
    }), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False


@mock_aws
def test_payment_order_not_found(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(make_event("POST /payment", body={
        "user_id": "user_001",
        "order_id": "order_fake",
        "stripe_token": "tok_simulated_test",
        "amount": 99.98,
    }), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 404
    assert body["success"] is False


@mock_aws
def test_payment_wrong_user(dynamodb_tables, seed_order):
    lf = get_lambda()

    seed_order(dynamodb_tables)

    res = lf.lambda_handler(make_event("POST /payment", body={
        "user_id": "user_hacker",
        "order_id": "order_001",
        "stripe_token": "tok_simulated_test",
        "amount": 99.98,
    }), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 403
    assert body["success"] is False


@mock_aws
def test_payment_already_paid_order(dynamodb_tables, seed_order):
    lf = get_lambda()

    seed_order(dynamodb_tables, status="paid")

    res = lf.lambda_handler(make_event("POST /payment", body={
        "user_id": "user_001",
        "order_id": "order_001",
        "stripe_token": "tok_simulated_test",
        "amount": 99.98,
    }), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False


@mock_aws
def test_payment_invalid_amount(dynamodb_tables, seed_order):
    lf = get_lambda()

    seed_order(dynamodb_tables)

    res = lf.lambda_handler(make_event("POST /payment", body={
        "user_id": "user_001",
        "order_id": "order_001",
        "stripe_token": "tok_simulated_test",
        "amount": 0,
    }), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 400
    assert body["success"] is False