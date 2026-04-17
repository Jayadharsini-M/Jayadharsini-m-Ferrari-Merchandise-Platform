import pytest
import boto3
import json
import os
import sys
from moto import mock_aws
from decimal import Decimal

# ── ENV SETUP ──────────────────────────────────────────────────────────────
os.environ["ORDERS_TABLE"] = "dev-ferrari-orders"
os.environ["PRODUCTS_TABLE"] = "dev-ferrari-products"
os.environ["CART_TABLE"] = "dev-ferrari-carts"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_fake"
os.environ["PRODUCT_SERVICE_URL"] = "http://localhost"
os.environ["AWS_DEFAULT_REGION"] = "ap-southeast-1"
os.environ["AWS_ACCESS_KEY_ID"] = "testing"
os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
os.environ["AWS_SECURITY_TOKEN"] = "testing"
os.environ["AWS_SESSION_TOKEN"] = "testing"


# ── Lambda cache cleaner ──────────────────────────────────────────────────
def clean_lambda_import():
    if "lambda_function" in sys.modules:
        del sys.modules["lambda_function"]


# ── DynamoDB fixture ───────────────────────────────────────────────────────
@pytest.fixture
def dynamodb_tables():
    with mock_aws():
        client = boto3.client("dynamodb", region_name="ap-southeast-1")

        client.create_table(
            TableName="dev-ferrari-orders",
            KeySchema=[{"AttributeName": "order_id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "order_id", "AttributeType": "S"},
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "created_at", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
            GlobalSecondaryIndexes=[{
                "IndexName": "user_id-created_at-index",
                "KeySchema": [
                    {"AttributeName": "user_id", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }],
        )

        client.create_table(
            TableName="dev-ferrari-products",
            KeySchema=[{"AttributeName": "product_id", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "product_id", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        client.create_table(
            TableName="dev-ferrari-carts",
            KeySchema=[
                {"AttributeName": "user_id", "KeyType": "HASH"},
                {"AttributeName": "product_id", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "user_id", "AttributeType": "S"},
                {"AttributeName": "product_id", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        yield boto3.resource("dynamodb", region_name="ap-southeast-1")


# ── FIXTURES ───────────────────────────────────────────────────────────────

@pytest.fixture
def seed_product():
    def _seed(dynamodb, product_id="prod_001", name="Ferrari Cap",
              price=49.99, stock=10):

        table = dynamodb.Table("dev-ferrari-products")
        table.put_item(Item={
            "product_id": product_id,
            "name": name,
            "description": "Official Ferrari merchandise",
            "price": Decimal(str(price)),
            "stock": Decimal(str(stock)),
            "image_url": "https://example.com/cap.jpg",
            "category": "accessories",
        })

        return product_id

    return _seed


@pytest.fixture
def seed_cart():
    def _seed(dynamodb, user_id="user_001",
              product_id="prod_001", quantity=2):

        table = dynamodb.Table("dev-ferrari-carts")
        table.put_item(Item={
            "user_id": user_id,
            "product_id": product_id,
            "quantity": Decimal(str(quantity)),
            "name": "Ferrari Cap",
            "price": Decimal("49.99"),
        })

        return user_id

    return _seed


@pytest.fixture
def seed_order():
    def _seed(dynamodb, order_id="order_001", user_id="user_001",
              status="confirmed", total=99.98):

        table = dynamodb.Table("dev-ferrari-orders")
        table.put_item(Item={
            "order_id": order_id,
            "user_id": user_id,
            "status": status,
            "order_total": Decimal(str(total)),
            "created_at": "2024-01-01T00:00:00+00:00",
            "updated_at": "2024-01-01T00:00:00+00:00",
            "items": json.dumps([{
                "product_id": "prod_001",
                "name": "Ferrari Cap",
                "quantity": 2,
                "price": 49.99,
                "item_total": 99.98,
            }]),
        })

        return order_id

    return _seed