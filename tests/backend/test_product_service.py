import json
import sys
import os
from moto import mock_aws

PRODUCT_SERVICE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../lambda/product_service")
)

from tests.backend.conftest import clean_lambda_import


def make_event(route, body=None, path_params=None):
    return {
        "routeKey": route,
        "pathParameters": path_params or {},
        "body": json.dumps(body) if body else None,
    }


def get_lambda():
    clean_lambda_import()
    if PRODUCT_SERVICE_PATH not in sys.path:
        sys.path.insert(0, PRODUCT_SERVICE_PATH)
    import lambda_function
    return lambda_function


# ═══════════════════════════════════════════════════════════════
# GET ALL PRODUCTS
# ═══════════════════════════════════════════════════════════════

@mock_aws
def test_get_all_products(dynamodb_tables, seed_product):
    lf = get_lambda()

    seed_product(dynamodb_tables)

    res = lf.lambda_handler(make_event("GET /products"), {})
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 200
    assert "products" in body
    assert len(body["products"]) >= 1


# ═══════════════════════════════════════════════════════════════
# GET SINGLE PRODUCT
# ═══════════════════════════════════════════════════════════════

@mock_aws
def test_get_single_product(dynamodb_tables, seed_product):
    lf = get_lambda()

    seed_product(dynamodb_tables)

    res = lf.lambda_handler(make_event(
        "GET /products/{product_id}",
        path_params={"product_id": "prod_001"}
    ), {})

    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 200
    assert body["name"] == "Ferrari Cap"


# ═══════════════════════════════════════════════════════════════
# PRODUCT NOT FOUND
# ═══════════════════════════════════════════════════════════════

@mock_aws
def test_get_product_not_found(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(make_event(
        "GET /products/{product_id}",
        path_params={"product_id": "prod_fake"}
    ), {})

    body = json.loads(res["body"])

    assert res["statusCode"] == 404
    assert "not found" in body["message"].lower()


# ═══════════════════════════════════════════════════════════════
# CREATE PRODUCT
# ═══════════════════════════════════════════════════════════════

@mock_aws
def test_create_product(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(make_event("POST /products", body={
        "name": "Ferrari Jacket",
        "description": "Official Ferrari jacket",
        "price": 299.99,
        "stock": 5,
        "image_url": "https://example.com/jacket.jpg",
        "category": "clothing",
    }), {})

    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] in [200, 201]
    assert "product_id" in body


# ═══════════════════════════════════════════════════════════════
# DELETE PRODUCT
# ═══════════════════════════════════════════════════════════════

@mock_aws
def test_delete_product(dynamodb_tables, seed_product):
    lf = get_lambda()

    seed_product(dynamodb_tables)

    res = lf.lambda_handler(make_event(
        "DELETE /products/{product_id}",
        path_params={"product_id": "prod_001"}
    ), {})

    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 200
    assert "deleted" in body["message"].lower()