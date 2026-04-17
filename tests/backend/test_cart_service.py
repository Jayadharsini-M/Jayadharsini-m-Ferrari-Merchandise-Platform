import json
import sys
import os
from moto import mock_aws
from unittest.mock import patch

CART_SERVICE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../lambda/cart_service")
)

from tests.backend.conftest import clean_lambda_import  # ONLY keep this


MOCK_PRODUCT = {
    "product_id": "prod_001",
    "name": "Ferrari Cap",
    "price": 49.99,
    "stock": 10,
}


def make_event(route, body=None, path_params=None):
    return {
        "routeKey": route,
        "pathParameters": path_params or {},
        "body": json.dumps(body) if body else None,
    }


def get_lambda():
    clean_lambda_import()

    if CART_SERVICE_PATH not in sys.path:
        sys.path.insert(0, CART_SERVICE_PATH)

    import lambda_function
    return lambda_function


@mock_aws
def test_add_to_cart_success(dynamodb_tables):
    lf = get_lambda()

    with patch.object(lf, "fetch_product", return_value=MOCK_PRODUCT):
        res = lf.lambda_handler(make_event("POST /cart", body={
            "user_id": "user_001",
            "product_id": "prod_001",
            "quantity": 2,
        }), {})
        body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")
    assert res["statusCode"] in [200, 201]
    assert "message" in body


@mock_aws
def test_add_to_cart_missing_fields(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(make_event("POST /cart", body={
        "user_id": "user_001",
        "quantity": 1,
    }), {})

    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")
    assert res["statusCode"] == 400
    assert "missing" in body["message"].lower()


@mock_aws
def test_get_cart_success(dynamodb_tables, seed_cart):
    lf = get_lambda()

    seed_cart(dynamodb_tables)

    res = lf.lambda_handler(
        make_event("GET /cart/{user_id}", path_params={"user_id": "user_001"}),
        {}
    )
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")
    assert res["statusCode"] == 200
    assert len(body["items"]) >= 1


@mock_aws
def test_get_cart_empty(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(
        make_event("GET /cart/{user_id}", path_params={"user_id": "user_nobody"}),
        {}
    )
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")
    assert res["statusCode"] == 200
    assert body["items"] == []


@mock_aws
def test_delete_cart_item(dynamodb_tables, seed_cart):
    lf = get_lambda()

    seed_cart(dynamodb_tables)

    res = lf.lambda_handler(make_event(
        "DELETE /cart/{user_id}/{product_id}",
        path_params={"user_id": "user_001", "product_id": "prod_001"}
    ), {})

    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")
    assert res["statusCode"] == 200
    assert "message" in body


@mock_aws
def test_clear_cart(dynamodb_tables, seed_cart):
    lf = get_lambda()

    seed_cart(dynamodb_tables)

    res = lf.lambda_handler(make_event(
        "DELETE /cart/{user_id}",
        path_params={"user_id": "user_001"}
    ), {})

    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")
    assert res["statusCode"] == 200
    assert "message" in body