<div align="center">

# 🏎️ Ferrari Merchandise Platform

### *Where Speed Meets Style — A Cloud-Native Serverless E-Commerce Experience*

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20Site-CC0000?style=for-the-badge)](https://devia4y9vql1s.cloudfront.net/)
[![AWS](https://img.shields.io/badge/AWS-CloudFront%20%7C%20Lambda%20%7C%20DynamoDB-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://terraform.io/)
[![PyTest](https://img.shields.io/badge/PyTest-Tested-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org/)

---

<img src="https://upload.wikimedia.org/wikipedia/en/d/d1/Ferrari-Logo.svg" width="120" alt="Ferrari Logo"/>

> *"A Ferrari is a dream — people dream of owning this most beautiful car."*
> — **Enzo Ferrari**

---

**⚡ Engineered for Speed. Designed for Luxury. Deployed on the Cloud. ⚡**

</div>

---

## 🌐 Live Demo

**🔗 URL:** https://devia4y9vql1s.cloudfront.net/login

Experience the Ferrari merchandise store — blazing fast, elegantly designed, and globally delivered via **AWS CloudFront CDN**.

---

## 🎯 Project Overview

The **Ferrari Merchandise Platform** is a full-stack, cloud-native, serverless e-commerce application built for Ferrari-branded merchandise and exclusive product drops. Designed with a **microservice-inspired AWS Lambda architecture**, every business capability is its own independent, deployable service.

The platform supports:
- 🛍️ Full shopping experience for customers
- 🔐 Separate **User** and **Admin** login portals
- ⚡ Flash sales & exclusive Ferrari Drops
- 📦 Real-time order and inventory management
- 💳 Stripe-integrated payment simulation
- 📊 Comprehensive observability via CloudWatch

All infrastructure is managed via **Terraform (Infrastructure as Code)**, with the frontend served globally through **AWS CloudFront + S3**.

---

## 🏗️ System Architecture

```
                        ┌─────────────────────────────────────────┐
                        │             User Browser                 │
                        └──────────────────┬──────────────────────┘
                                           │ HTTPS
                        ┌──────────────────▼──────────────────────┐
                        │         AWS CloudFront CDN               │
                        │   https://devia4y9vql1s.cloudfront.net   │
                        └──────────────────┬──────────────────────┘
                                           │
                        ┌──────────────────▼──────────────────────┐
                        │      Amazon S3 — React Frontend          │
                        │    (Static Site Hosting + Assets)        │
                        └──────────────────┬──────────────────────┘
                                           │
                        ┌──────────────────▼──────────────────────┐
                        │       API Gateway HTTP API (/v1)         │
                        │   Base: cx4u0cff8i.execute-api.ap-       │
                        │         southeast-1.amazonaws.com        │
                        └──┬──────────┬──────────┬───────────┬────┘
                           │          │          │           │
              ┌────────────▼──┐  ┌────▼──────┐  ┌▼────────┐ ┌▼──────────────┐
              │ Product Svc   │  │ Cart Svc  │  │Order Svc│ │ Payment Svc   │
              │ Catalog &     │  │ Add/Remove│  │Process &│ │ Stripe-style  │
              │ Inventory     │  │ Update    │  │ Track   │ │ Checkout      │
              └───────┬───────┘  └─────┬─────┘  └────┬────┘ └──────┬────────┘
                      │               │              │              │
                      └───────────────┴──────────────┴──────────────┘
                                              │
                        ┌─────────────────────▼───────────────────┐
                        │            Amazon DynamoDB               │
                        │  ┌─────────┐ ┌──────────┐ ┌──────────┐  │
                        │  │Products │ │  Carts   │ │  Orders  │  │
                        │  │  Table  │ │  Table   │ │  Table   │  │
                        │  └─────────┘ └──────────┘ └──────────┘  │
                        └─────────────────────────────────────────┘
                                              │
                        ┌─────────────────────▼───────────────────┐
                        │         Observability Layer              │
                        │  CloudWatch Logs · Dashboard · Alarms   │
                        │         SNS Email Notifications          │
                        └─────────────────────────────────────────┘
                                              │
                        ┌─────────────────────▼───────────────────┐
                        │     Terraform-Managed Infrastructure     │
                        │  main.tf · cors.tf · payment.tf ·        │
                        │  variables.tf · outputs.tf · cloudwatch.tf│
                        └─────────────────────────────────────────┘
```

---

## 🔐 User & Admin Login System

The platform features a **dedicated Login Page** serving as the secure entry point with two distinct access paths.

```
                    ┌─────────────────────────────┐
                    │         Login Page           │
                    │   🏎️  Ferrari Platform       │
                    └──────────────┬──────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                  │
        ┌─────────▼──────────┐            ┌──────────▼─────────┐
        │    👤  USER LOGIN  │            │  🔧  ADMIN LOGIN   │
        │                    │            │                     │
        │  Access Granted    │            │  Access Granted     │
        │  ─────────────     │            │  ─────────────      │
        │  ✅ Product Catalog│            │  ✅ Manage Products │
        │  ✅ Ferrari Drops  │            │  ✅ Configure Drops │
        │  ✅ Shopping Cart  │            │  ✅ Flash Sales     │
        │  ✅ Place Orders   │            │  ✅ Manage Inventory│
        │  ✅ Track Purchases│            │  ✅ Monitor Platform│
        │  ✅ Search Products│            │  ✅ Admin Dashboard │
        └─────────┬──────────┘            └──────────┬─────────┘
                  │                                   │
                  └──────────────┬────────────────────┘
                                 │
                     ┌───────────▼────────────┐
                     │      API Gateway        │
                     │   Lambda Microservices  │
                     │       DynamoDB          │
                     └────────────────────────┘
```

### 👤 User Portal
Regular customers get access to the full shopping experience:
- Browse the Ferrari merchandise catalog
- View exclusive **Ferrari Drops** with countdown timers
- Manage their shopping cart
- Place and track orders
- Search & filter products by name or price range

### 🔧 Admin Portal
Platform administrators have privileged access to:
- Create, update, and delete products
- Configure **Flash Sale / Ferrari Drops** with stock limits and expiry timers
- Monitor active drops and inventory levels
- Manage platform content via the Admin Dashboard

---

## 🔄 System Flow

```
 1. 🧑  User visits Ferrari Merchandise Platform
         │
         ▼
 2. 🌐  CloudFront CDN serves the React frontend (from S3)
         │
         ▼
 3. 🔐  Login Page — User selects their role
         │
    ┌────┴──────┐
    │           │
    ▼           ▼
  User        Admin
    │           │
    ▼           ▼
 4. 🔍  Search Service   → filter and discover products by keyword / price
 5. 📦  Product Service  → fetch product details, catalog, and Flash Sale status
         │
         ▼
 6. 🛒  Cart Service     → add, remove, and update cart items
         │
         ▼
 7. 💳  Payment Service  → initiate Stripe-style checkout flow
         │
         ▼
 8. 📋  Order Service    → generate and confirm the final order
         │
         ▼
 9. 💾  DynamoDB         → persist all products, cart, and order data
         │
         ▼
10. 📊  CloudWatch       → log, monitor, and alert on all service activity
         │
         ▼
11. 📧  SNS              → email notification on critical alarms
         │
         ▼
12. ✅  All infrastructure deployed and managed via Terraform
```

---

## ⚡ Ferrari Drops — Flash Sale System

One of the platform's flagship features is the **Ferrari Drops** system — exclusive, time-limited flash sales for selected Ferrari products.

```
Admin Configures Drop
         │
         ▼
┌────────────────────────┐
│   Flash Sale Settings  │
│  ─────────────────     │
│  🏷️  Flash Label       │
│  ⏳  Drop End Time     │
│  📦  Stock Limit       │
│  🏎️  Product ID        │
└──────────┬─────────────┘
           │
           ▼ PUT /v1/products/{product_id}/flash
┌────────────────────────┐
│   Product Service      │
│   Marks as Flash Sale  │
└──────────┬─────────────┘
           │
           ▼ GET /v1/products/drops
┌────────────────────────┐
│   Drops Page (React)   │
│  ─────────────────     │
│  🔴 FLASH SALE badge   │
│  ⏱️  Live Countdown    │
│  📉  Limited Stock     │
│  🛒  Add to Cart       │
└────────────────────────┘
```

**Features:**
- Dynamic flash sale badges on product cards
- Live countdown timers updating in real-time
- Limited stock visibility to create urgency
- Sale expiration tracking — drops disappear automatically after end time
- Dedicated **Drops Page** for all active flash sales

---

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| 🏎️ Ferrari Catalog | Full product listings with Ferrari-branded merchandise |
| 🔐 Dual Login System | Separate portals for Users and Admins with role-based access |
| ⚡ Ferrari Drops | Admin-configured flash sales with countdown timers and limited stock |
| 🔍 Smart Search | Filter products by keyword, minimum price, and maximum price |
| 🛒 Cart Management | Add, update, and remove cart items per user |
| 📦 Order Processing | Full order lifecycle — place, view, track, and cancel orders |
| 💳 Payment Gateway | Stripe-integrated payment simulation with status tracking |
| 📊 Admin Dashboard | Centralised product, drop, and inventory management |
| ☁️ Global CDN | AWS CloudFront for ultra-fast worldwide delivery |
| 📡 Observability | CloudWatch Logs, Dashboard, Alarms, and SNS notifications |
| ⚙️ Microservices | Five independently deployable, stateless Lambda services |
| 🧪 Tested Services | PyTest-based unit test suite for every Lambda function |
| 🏗️ IaC Deployments | Entire infrastructure declared and managed via Terraform |

---

## 📁 Project Structure

```
ferrari-ecommerce/
│
├── frontend/
│   └── ferrari-frontend/
│       ├── public/
│       └── src/
│           ├── components/        ← Reusable UI components
│           ├── pages/             ← Page-level views
│           │   ├── LoginPage/     ← User & Admin login
│           │   ├── ShopPage/      ← Product catalog
│           │   ├── DropsPage/     ← Ferrari flash sales
│           │   ├── CartPage/      ← Shopping cart
│           │   └── OrderPage/     ← Order tracking
│           ├── services/          ← API call abstractions
│           └── context/           ← Global state management
│
├── lambda/
│   ├── product_service/
│   │   ├── lambda_function.py
│   │   └── tests/
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
│   ├── search_service/
│   │   ├── lambda_function.py
│   │   └── tests/
│   └── shared/
│       └── logger.py              ← Shared structured logging module
│
├── terraform/
│   ├── main.tf                    ← Core infrastructure
│   ├── cors.tf                    ← CORS configuration
│   ├── payment.tf                 ← Stripe-related infra
│   ├── cloudwatch.tf              ← Monitoring & alarms
│   ├── variables.tf
│   ├── outputs.tf
│   ├── terraform.tfstate
│   └── terraform.tfstate.backup
│
├── backend/
│   ├── test_cart_service.py
│   ├── test_order_service.py
│   ├── test_payment_service.py
│   ├── test_product_service.py
│   ├── test_search_service.py
│   └── conftest.py                ← Shared fixtures & config
│
└── README.md
```

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React | Component-based UI development |
| Vite | Fast frontend build tooling |
| Axios | HTTP client for API calls |
| JavaScript (ES6+) | Application logic, state management |
| HTML5 / CSS3 | Markup and styling |
| Node.js | Runtime and build tooling |

**Frontend Features:**
- Responsive Ferrari-themed UI
- Role-based routing (User / Admin)
- Flash Sale Countdown Timers
- Product Search & Filter
- Shopping Cart with live updates
- Admin Dashboard
- Order Tracking

### Backend
| Technology | Purpose |
|-----------|---------|
| Python 3.11 | AWS Lambda-style service functions |
| Stripe API | Payment gateway (simulated service layer) |
| Shared Logger | Structured JSON logging across all services |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| Terraform | Infrastructure as Code — full AWS lifecycle management |
| AWS Lambda | Serverless compute for all microservices |
| API Gateway (HTTP) | Route and manage all REST API calls |
| Amazon DynamoDB | NoSQL database for products, carts, and orders |
| Amazon S3 | Frontend static hosting + product image storage |
| AWS CloudFront | Global CDN for fast, low-latency delivery |
| AWS CloudWatch | Logging, dashboards, and automated alarms |
| AWS SNS | Email notifications on critical alarm triggers |
| AWS IAM | Roles, policies, and permissions |
| ZIP Packaging | Lambda function deployment artifacts |

### Testing
| Technology | Purpose |
|-----------|---------|
| PyTest | Unit testing for all Lambda services |
| conftest.py | Shared test fixtures and configuration |

---

## 📡 API Endpoints

**Base URL:** `https://cx4u0cff8i.execute-api.ap-southeast-1.amazonaws.com`

### 📦 Product Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/products` | List all products |
| `POST` | `/v1/products` | Create a new product |
| `GET` | `/v1/products/{product_id}` | Get a specific product |
| `PUT` | `/v1/products/{product_id}` | Update a product |
| `DELETE` | `/v1/products/{product_id}` | Delete a product |
| `PUT` | `/v1/products/{product_id}/flash` | Configure flash sale for a product |
| `GET` | `/v1/products/drops` | Get all active flash sale drops |

### 🛒 Cart Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/cart` | Add item to cart |
| `GET` | `/v1/cart/{user_id}` | Get cart contents for a user |
| `DELETE` | `/v1/cart/{user_id}` | Clear entire cart for a user |
| `DELETE` | `/v1/cart/{user_id}/{product_id}` | Remove a specific product from cart |

### 📋 Order Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/order` | Place a new order |
| `GET` | `/v1/order/{order_id}` | Get details of a specific order |
| `GET` | `/v1/orders/{user_id}` | Get all orders for a user |
| `POST` | `/v1/cancel-order` | Cancel an order |

### 💳 Payment Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/payment` | Initiate a payment |
| `GET` | `/v1/payment` | Get payment status / health check |

### 🔍 Search Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/search` | Search and filter products |

Supports query parameters:
```
?q=           → keyword search
&min_price=   → minimum price filter
&max_price=   → maximum price filter
```

### 🔄 CORS
| Method | Endpoint | Description |
|--------|----------|-------------|
| `OPTIONS` | `/{proxy+}` | CORS preflight handler for all routes |

---

## 🪣 AWS S3 Bucket Usage

```
S3 Bucket
├── frontend/            ← React build (served via CloudFront)
└── product-images/      ← Ferrari merchandise product images
```

Amazon S3 powers two key capabilities:

- 🖼️ **Product Image Storage** — All Ferrari merchandise images are stored in S3 and served directly to the frontend, enabling scalable media management
- 🌐 **Frontend Hosting** — The compiled React build is deployed to S3, with CloudFront as the global CDN layer on top

---

## 📊 Observability

### CloudWatch Logs
Logs are collected from all services:
- Product Service
- Cart Service
- Order Service
- Search Service
- Payment Service
- API Gateway access logs

### Structured Logging
A **shared logger module** (`lambda/shared/logger.py`) ensures:
- Consistent JSON log format across all services
- Easier debugging and log querying
- Improved traceability per request
- Better operational visibility in CloudWatch

### CloudWatch Dashboard
The centralised dashboard monitors:

| Metric | Service |
|--------|---------|
| Lambda Invocations | All services |
| Lambda Errors | All services |
| Lambda Duration (P99) | All services |
| API Gateway Requests | API Gateway |
| API Gateway Latency | API Gateway |
| DynamoDB Read/Write | All tables |
| CloudFront Cache Hit Rate | CDN |

### CloudWatch Alarms & SNS

Automated alarms trigger email notifications via SNS:

```
┌────────────────────────────────────────────────┐
│              CloudWatch Alarms                  │
│                                                 │
│  🔴 Payment Errors    → Errors > 3             │
│  🔴 Lambda Errors     → Errors > 5             │
│  🔴 API Latency       → Latency > 2000 ms      │
│  🔴 DynamoDB Throttle → Throttles > 0          │
└───────────────────────┬────────────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │   SNS Topic    │
               └───────┬────────┘
                        │
                        ▼
               📧 Email Notification
```

This enables proactive monitoring and rapid incident response.

---

## ☁️ Infrastructure — Terraform

All AWS infrastructure is fully managed via Terraform:

| File | Purpose |
|------|---------|
| `main.tf` | Core infrastructure — Lambda, API Gateway, S3, CloudFront, DynamoDB, IAM |
| `cors.tf` | Cross-origin resource sharing configuration |
| `payment.tf` | Stripe-related Lambda and API infrastructure |
| `cloudwatch.tf` | Dashboards, log groups, alarms, and SNS topics |
| `variables.tf` | Configurable input parameters |
| `outputs.tf` | Infrastructure outputs — URLs, ARNs, table names |

**Key benefits:**
- ✅ Version-controlled infrastructure
- ✅ Fully repeatable deployments
- ✅ Automated resource provisioning
- ✅ Environment consistency

---

## 🧪 Testing

Every Lambda service has **independent unit tests** to ensure reliability in isolation.

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

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11
- Node.js (for frontend)
- Terraform
- AWS CLI configured

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/ferrari-ecommerce.git
cd ferrari-ecommerce
```

### 2. Deploy infrastructure

```bash
cd terraform/
terraform init
terraform validate
terraform plan
terraform apply
```

### 3. Set up frontend

```bash
cd frontend/ferrari-frontend/
npm install
npm run dev
```

---

## 🔮 Future Improvements

- 🔐 Real authentication system — JWT / OAuth2 with secure session management
- 📊 Enhanced Admin Dashboard with analytics and revenue tracking
- 🛡️ API Gateway rate limiting and request authorization
- 📩 Order confirmation emails via SES
- 🔔 CloudWatch integration for real-time platform health visibility
- 📦 CI/CD pipeline — GitHub Actions for automated deploy on push

---

## 🧠 What I Learned

- ⚡ **Serverless Architecture** — designing and deploying AWS Lambda-style microservices
- 🏗️ **Infrastructure as Code** — managing full cloud resources declaratively with Terraform
- 🧩 **Microservice Design** — loosely coupled, independently deployable services
- 🔄 **Full-Stack System Design** — connecting React frontend flows to Lambda backend logic
- 💳 **Payment Workflow Simulation** — integrating Stripe in a service layer pattern
- 🧪 **Modular Testing** — writing reliable PyTest suites for each microservice
- 📊 **Observability Engineering** — structured logging, CloudWatch dashboards, alarms, and SNS
- ⚡ **Flash Sale Architecture** — real-time countdown, stock control, and drop configuration

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

⚡ *Engineered for Speed. Designed for Luxury. Deployed on the Cloud.* ⚡

🏎️🔴⚫🏎️🔴⚫🏎️🔴⚫🏎️🔴⚫🏎️

</div>
