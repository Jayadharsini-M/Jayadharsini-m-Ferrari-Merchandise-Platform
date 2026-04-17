<div align="center">

# 🏎️ Ferrari Merchandise Platform

### *Where Speed Meets Style — A Serverless E-Commerce Experience*

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20Site-CC0000?style=for-the-badge)](https://devia4y9vql1s.cloudfront.net/)
[![AWS](https://img.shields.io/badge/AWS-CloudFront%20%7C%20Lambda-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://terraform.io/)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![PyTest](https://img.shields.io/badge/PyTest-Tested-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org/)

---

> *"A Ferrari is a dream — people dream of owning this most beautiful car."*
> — Enzo Ferrari

</div>

---

## 🌐 Live Demo

**🔗 URL:** [https://devia4y9vql1s.cloudfront.net/](https://devia4y9vql1s.cloudfront.net/)

Experience the Ferrari merchandise store — fast, elegant, and globally delivered via AWS CloudFront CDN.

---

## 🎯 Project Overview

The **Ferrari Merchandise Platform** is a full-stack, serverless-style e-commerce web application for Ferrari-branded merchandise. Built with a **microservice-inspired Lambda architecture**, the platform simulates real-world cloud-native backend services using AWS Lambda-style Python functions.

Each service is independently deployable, loosely coupled, and managed entirely through **Terraform Infrastructure as Code**. The frontend is a blazing-fast static application served globally via **AWS CloudFront**.

---

## 🏗️ Architecture

```
                    ┌─────────────────────────────────────────────┐
                    │              User Browser                    │
                    └─────────────────┬───────────────────────────┘
                                      │ HTTPS
                    ┌─────────────────▼───────────────────────────┐
                    │       AWS CloudFront CDN                     │
                    │  https://devia4y9vql1s.cloudfront.net        │
                    └─────────────────┬───────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │         Static Frontend (HTML/CSS/JS)        │
                    └─────────────────┬───────────────────────────┘
                                      │ Simulated API Calls
          ┌───────────────────────────┼────────────────────────────────┐
          │                 Lambda-Style Microservices                 │
          │                                                            │
          │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
          │  │product_service│  │search_service│  │  cart_service│     │
          │  │  Catalog &   │  │  Filter &    │  │  Add/Remove/ │      │
          │  │  Inventory   │  │  Discovery   │  │  Update Cart │      │
          │  └──────────────┘  └──────────────┘  └──────────────|      │
          │                                                            │
          │  ┌──────────────┐  ┌──────────────────────────────────┐    │
          │  │order_service │  │        payment_service            │   │
          │  │  Process &   │  │   Stripe Integration (simulated)  │   │
          │  │  Track Orders│  │   Checkout Workflow               │   │
          │  └──────────────┘  └──────────────────────────────────┘    │
          └─────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────────┐
                    │           Terraform-Managed Infrastructure  │
                    │  main.tf · cors.tf · payment.tf · iam.tf    │
                    └─────────────────────────────────────────────┘
```

---

## 🧠 Architecture Style

The platform follows a **serverless microservices architecture**:

- 🔩 Each core feature is implemented as an **independent Lambda-style Python service**
- 📦 Services are **packaged as ZIP files** and deployed via Terraform
- 🔗 The frontend interacts with services through **simulated API flows**
- ⚡ Each service is **stateless, modular, and independently testable**
- ☁️ Infrastructure is **fully declarative** — defined in `.tf` files and reproducible

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| 🏎️ Ferrari Catalog | Themed product listings with Ferrari merchandise |
| 🔍 Smart Search | Search and filter products via dedicated search service |
| 🛒 Cart Management | Add, remove, and update cart items via Lambda service |
| 📦 Order Processing | Complete order lifecycle management |
| 💳 Payment Gateway | Stripe-integrated payment simulation service |
| ☁️ Global CDN | AWS CloudFront for fast, worldwide delivery |
| ⚙️ Modular Backend | Fully independent, testable microservices |
| 🧪 Tested Services | PyTest-based test suite for all Lambda functions |

---

## 🔄 System Flow

```
1. 🧑 User visits the Ferrari Merchandise Platform
        │
        ▼
2. 🖥️  Static Frontend (HTML/CSS/JS) loads from CloudFront
        │
        ▼
3. 🔍  Search Service     → filter and discover products
4. 📦  Product Service    → fetch product details and catalog
        │
        ▼
5. 🛒  Cart Service       → manage items in the cart
        │
        ▼
6. 💳  Payment Service    → simulate Stripe checkout flow
        │
        ▼
7. 📋  Order Service      → generate and confirm the final order
        │
        ▼
8. ✅  All services deployed independently via Terraform
```

---

## 📁 Project Structure

```
ferrari-merchandise-platform/
│
├── frontend/
│   └── ferrari-frontend/
│       ├── node_modules/
│       ├── package.json
│       └── package-lock.json
│
├── lambda/
│   ├── cart_service/
│   │   ├── lambda_function.py
│   │   └── tests/
│   ├── order_service/
│   │   ├── lambda_function.py
│   │   └── tests/
│   ├── payment_service/
│   │   ├── lambda_function.py
│   │   ├── stripe/
│   │   └── tests/
│   ├── product_service/
│   │   ├── lambda_function.py
│   │   └── tests/
│   └── search_service/
│       ├── lambda_function.py
│       └── tests/
│
├── terraform/
│   ├── main.tf
│   ├── cors.tf
│   ├── payment.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfstate
│   └── terraform.tfstate.backup
│
└── backend/
    ├── test_cart_service.py
    ├── test_order_service.py
    ├── test_payment_service.py
    ├── test_product_service.py
    ├── test_search_service.py
    └── conftest.py
```

---

## 🧰 Tech Stack

| Technology                   | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| React                        | Component-based UI development                           |
| Node.js (build/runtime)      | Running and serving the frontend application             |
| JavaScript (ES6+)            | Application logic, state management, and API integration |


### Backend
| Technology | Purpose |
|-----------|---------|
| Python | AWS Lambda-style service functions |
| Stripe API | Payment gateway (simulated service layer) |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Terraform | Infrastructure as Code — manages all AWS resources |
| AWS CloudFront | Global CDN for fast frontend delivery |
| AWS S3 | Frontend static hosting + product image storage |
| ZIP Packaging | Lambda function deployment artifacts |

### Testing
| Technology | Purpose |
|-----------|---------|
| PyTest | Unit testing for all Lambda services |
| conftest.py | Shared test fixtures and configuration |

---

## ☁️ Infrastructure (Terraform)

All infrastructure is **fully managed via Terraform**:

- Each Lambda service is **packaged as a ZIP archive** and deployed declaratively
- API configurations, CORS rules, and payment integrations are defined in `.tf` files
- `main.tf` orchestrates the overall infrastructure
- `cors.tf` handles cross-origin resource sharing configuration
- `payment.tf` manages Stripe-related infrastructure
- State is tracked via `terraform.tfstate` for reproducible deployments
- **AWS S3** is provisioned for frontend static hosting and product image storage
- **AWS CloudFront** is configured to serve the S3-hosted frontend globally

---

## 📡 API Endpoints

**Base URL:** `https://cx4u0cff8i.execute-api.ap-southeast-1.amazonaws.com`

| Method | Endpoint | Service | Description |
|--------|----------|---------|-------------|
| `GET` | `/cancel-order/{user_id}` | Order Service | Cancel a specific user's order |
| `POST` | `/cart` | Cart Service | Add item to cart |
| `POST` | `/cart/{user_id}` | Cart Service | Update cart for a specific user |
| `DELETE` | `/cart/{user_id}` | Cart Service | Remove item from cart |
| `GET` | `/cart/{user_id}` | Cart Service | Get cart contents for a user |
| `DELETE` | `/cart/{product_id}` | Cart Service | Remove a specific product from cart |
| `POST` | `/order` | Order Service | Place a new order |
| `GET` | `/order/{order_id}` | Order Service | Get details of a specific order |
| `GET` | `/orders/{user_id}` | Order Service | Get all orders for a user |
| `POST` | `/payment` | Payment Service | Initiate a payment |
| `GET` | `/payment` | Payment Service | Get payment status |
| `GET` | `/products` | Product Service | List all products |
| `POST` | `/products` | Product Service | Create a new product |
| `GET` | `/products/{product_id}` | Product Service | Get a specific product |
| `DELETE` | `/products/{product_id}` | Product Service | Delete a product |
| `PUT` | `/products/{product_id}` | Product Service | Update a product |
| `GET` | `/search` | Search Service | Search and filter products |
| `OPTIONS` | `/{proxy+}` | All Services | CORS preflight handler |

---

## 🪣 AWS S3 Bucket Usage

The project uses **AWS S3** for two key purposes:

- 🖼️ **Product Images** — All Ferrari merchandise product images are stored in an S3 bucket and served to the frontend, enabling easy image management and scalable media delivery
- 🌐 Frontend Hosting — The frontend (React application) is bundled and served via a Node.js server, which handles deployment and serves the client-side build to users.

```
S3 Bucket
├── frontend/          ← Static site files (served via CloudFront)
└── product-images/    ← Ferrari merchandise product images
```

---

## 🧪 Testing

```bash
# Run all backend tests
cd backend/
pytest -v

# Run individual service tests
pytest test_product_service.py -v
pytest test_cart_service.py -v
pytest test_order_service.py -v
pytest test_payment_service.py -v
pytest test_search_service.py -v
```

Every Lambda service has **independent unit tests**, ensuring each microservice is reliable and verifiable in isolation.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.x
- Node.js (for frontend)
- Terraform 1.x+
- AWS CLI configured

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ferrari-merchandise-platform
```

### 2. Deploy infrastructure

```bash
cd terraform/
terraform init
terraform plan
terraform apply
```

### 3. Set up frontend

```bash
cd frontend/ferrari-frontend/
npm install
```

---

## 🧠 What I Learned

- ⚡ **Serverless architecture** — designing and deploying AWS Lambda-style functions
- 🏗️ **Infrastructure as Code** — managing cloud resources with Terraform
- 🧩 **Microservice design** — building loosely coupled, independently deployable services
- 🔄 **Full-stack system design** — connecting frontend flows to backend service logic
- 💳 **Payment workflow simulation** — integrating Stripe in a service layer pattern
- 🧪 **Modular testing** — writing reliable PyTest suites for each service

---

## 🔮 Future Improvements

- 🔐 Real authentication system (JWT / OAuth2)
- 📊 Admin dashboard for product and order management
- Cloudwatch 
- 🛡️ API Gateway with rate limiting and authorization

---

## 🌍 Live Deployment

The platform is hosted using **AWS CloudFront CDN** — ensuring fast, low-latency delivery to users across the globe.

🔗 **Live URL:** [https://devia4y9vql1s.cloudfront.net/](https://devia4y9vql1s.cloudfront.net/)

---

## 👩‍💻 Author

**Jayadharsini M**

> *Built with passion for performance, design, and Ferrari-inspired luxury experience* 🏎️🔥

---

<div align="center">

⚡ *Engineered for speed. Designed for luxury. Deployed on the cloud.* ⚡

</div>
