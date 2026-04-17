import json
import sys
import os
from moto import mock_aws

SEARCH_SERVICE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../lambda/search_service")
)

# FIX: DO NOT import from conftest
# fixtures will be injected by pytest automatically


def make_event(route, query_params=None):
    return {
        "routeKey": route,
        "queryStringParameters": query_params or {},
        "body": None,
    }


def get_lambda():
    # reset lambda import to avoid caching issues
    if SEARCH_SERVICE_PATH not in sys.path:
        sys.path.insert(0, SEARCH_SERVICE_PATH)

    if "lambda_function" in sys.modules:
        del sys.modules["lambda_function"]

    import lambda_function
    return lambda_function


@mock_aws
def test_search_by_keyword(dynamodb_tables, seed_product):
    lf = get_lambda()

    seed_product(dynamodb_tables, name="Ferrari Cap")

    res = lf.lambda_handler(
        make_event("GET /search", query_params={"q": "Ferrari"}),
        {}
    )
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 200
    assert "products" in body
    assert len(body["products"]) >= 1


@mock_aws
def test_search_no_results(dynamodb_tables):
    lf = get_lambda()

    res = lf.lambda_handler(
        make_event("GET /search", query_params={"q": "Lamborghini"}),
        {}
    )
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 200
    assert body["products"] == []
    assert body["count"] == 0


@mock_aws
def test_search_by_price_range(dynamodb_tables, seed_product):
    lf = get_lambda()

    seed_product(dynamodb_tables, price=49.99)

    res = lf.lambda_handler(
        make_event("GET /search", query_params={
            "min_price": "10",
            "max_price": "100",
        }),
        {}
    )
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 200
    assert len(body["products"]) >= 1


@mock_aws
def test_search_empty_query(dynamodb_tables, seed_product):
    lf = get_lambda()

    seed_product(dynamodb_tables)

    res = lf.lambda_handler(
        make_event("GET /search", query_params={}),
        {}
    )
    body = json.loads(res["body"])

    print(f"  Response: {res['statusCode']} → {body}")

    assert res["statusCode"] == 200
    assert body["count"] >= 1