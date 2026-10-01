from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from decimal import Decimal
from uuid import uuid4
import os

from .database import engine, Base, get_db
from . import models


app = FastAPI(
    title="Noir_scents API",
    description="Backend API for the Noir_scents online perfume store",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        *[
            origin.strip().rstrip("/")
            for origin in os.getenv("FRONTEND_URL", "").split(",")
            if origin.strip()
        ],
    ])),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


# =========================================================
# ORDER SCHEMAS
# =========================================================

class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int


class CreateOrderRequest(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    delivery_address: str
    city: str | None = None
    state: str | None = None
    payment_method: str
    items: list[OrderItemRequest]


# =========================================================
# ROOT / HEALTH CHECK
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Noir_scents API is running",
        "status": "ok",
    }


# =========================================================
# GET PRODUCTS
# =========================================================

@app.get("/api/products")
def get_products(
    db: Session = Depends(get_db),
):
    products = (
        db.query(models.Product)
        .filter(models.Product.active == True)
        .order_by(models.Product.id.asc())
        .all()
    )

    return [
        {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "gender": product.gender,
            "size": product.size,
            "price": float(product.price),
            "category": product.category,
            "image_url": product.image_url,
            "stock": product.stock,
        }
        for product in products
    ]


# =========================================================
# CREATE ORDER
# =========================================================

@app.post("/api/orders")
def create_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # Check cart
    # -----------------------------------------------------

    if not request.items:
        raise HTTPException(
            status_code=400,
            detail="Your cart is empty.",
        )

    # -----------------------------------------------------
    # Validate payment method
    # -----------------------------------------------------

    allowed_payment_methods = {
        "paystack",
        "flutterwave",
        "opay",
        "bank",
    }

    if request.payment_method not in allowed_payment_methods:
        raise HTTPException(
            status_code=400,
            detail="Invalid payment method.",
        )

    subtotal = Decimal("0.00")
    order_items = []

    try:

        # -------------------------------------------------
        # Validate every product
        # -------------------------------------------------

        for requested_item in request.items:

            if requested_item.quantity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="Quantity must be greater than zero.",
                )

            product = (
                db.query(models.Product)
                .filter(
                    models.Product.id == requested_item.product_id,
                    models.Product.active == True,
                )
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Product {requested_item.product_id} "
                        "was not found."
                    ),
                )

            # ---------------------------------------------
            # Check stock
            # ---------------------------------------------

            if product.stock < requested_item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Not enough stock for {product.name}. "
                        f"Only {product.stock} available."
                    ),
                )

            # ---------------------------------------------
            # Calculate using database price
            # ---------------------------------------------

            line_total = (
                product.price * requested_item.quantity
            )

            subtotal += line_total

            order_items.append(
                {
                    "product": product,
                    "quantity": requested_item.quantity,
                    "line_total": line_total,
                }
            )

        # -------------------------------------------------
        # Delivery
        # -------------------------------------------------

        # Free delivery on orders over ₦50,000
        if subtotal >= Decimal("50000.00"):
            delivery_fee = Decimal("0.00")
        else:
            # Currently free while the store is being built.
            delivery_fee = Decimal("0.00")

        total = subtotal + delivery_fee

        # -------------------------------------------------
        # Generate order number
        # -------------------------------------------------

        order_number = (
            f"NS-{uuid4().hex[:10].upper()}"
        )

        # -------------------------------------------------
        # Create order
        # -------------------------------------------------

        order = models.Order(
            order_number=order_number,
            customer_name=request.customer_name,
            customer_email=str(request.customer_email),
            customer_phone=request.customer_phone,
            delivery_address=request.delivery_address,
            city=request.city,
            state=request.state,
            currency="NGN",
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total=total,
            payment_method=request.payment_method,
            payment_status="PENDING",
            order_status="PENDING",
        )

        db.add(order)

        # Get generated order ID
        db.flush()

        # -------------------------------------------------
        # Create order items + reduce stock
        # -------------------------------------------------

        for item in order_items:

            product = item["product"]
            quantity = item["quantity"]
            line_total = item["line_total"]

            order_item = models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity,
                line_total=line_total,
            )

            db.add(order_item)

            # Reduce inventory
            product.stock -= quantity

        # -------------------------------------------------
        # Save everything
        # -------------------------------------------------

        db.commit()
        db.refresh(order)

        return {
            "success": True,
            "message": "Order created successfully.",
            "order_id": order.id,
            "order_number": order.order_number,
            "subtotal": float(order.subtotal),
            "delivery_fee": float(order.delivery_fee),
            "total": float(order.total),
            "currency": order.currency,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "order_status": order.order_status,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print("ORDER CREATION ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to create your order.",
        )
