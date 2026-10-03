from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from decimal import Decimal
from uuid import uuid4
import os
import requests
from datetime import datetime, timedelta, timezone
from google.auth.exceptions import TransportError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from jose import JWTError, jwt
from sqlalchemy import update

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
        "https://noir-scents-chi.vercel.app",
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


class GoogleAuthRequest(BaseModel):
    credential: str


# =========================================================
# ROOT / HEALTH CHECK
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Noir_scents API is running",
        "status": "ok",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# =========================================================
# GOOGLE SIGN-IN
# =========================================================

def create_session_token(user: models.User) -> str:
    secret = os.getenv("AUTH_SECRET_KEY", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Authentication is not configured on the server.")

    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user.id), "iat": now, "exp": now + timedelta(days=7)},
        secret,
        algorithm="HS256",
    )


def get_session_user(authorization: str | None, db: Session) -> models.User:
    secret = os.getenv("AUTH_SECRET_KEY", "").strip()
    if not secret or not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    try:
        claims = jwt.decode(authorization[7:], secret, algorithms=["HS256"])
        user_id = int(claims["sub"])
    except (JWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Your session is invalid or expired.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Account not found.")
    return user


def send_welcome_email(user: models.User) -> bool:
    api_key = os.getenv("MAILGUN_API_KEY", "").strip()
    domain = os.getenv("MAILGUN_DOMAIN", "").strip()
    sender = os.getenv("MAILGUN_FROM", "").strip()
    if not api_key or not domain or not sender:
        print("Mailgun is not configured; welcome email skipped.")
        return False

    base_url = os.getenv("MAILGUN_BASE_URL", "https://api.mailgun.net").strip().rstrip("/")
    name = user.name or "there"
    body = "\n".join([
        f"Hello {name},",
        "",
        "Welcome to Noir Scents!",
        "Your account has been created successfully. You can now sign in with Google",
        "to make checkout easier.",
        "",
        "Thank you for joining us.",
        "",
        "Noir Scents",
    ])

    try:
        response = requests.post(
            f"{base_url}/v3/{domain}/messages",
            auth=("api", api_key),
            data={
                "from": sender,
                "to": user.email,
                "subject": "Welcome to Noir Scents",
                "text": body,
            },
            timeout=10,
        )
        response.raise_for_status()
        return True
    except requests.RequestException as error:
        status_code = getattr(getattr(error, "response", None), "status_code", None)
        print(f"Mailgun welcome email failed (HTTP {status_code or 'request error'}).")
        return False


@app.post("/api/auth/google")
def google_sign_in(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    if not client_id or not os.getenv("AUTH_SECRET_KEY", "").strip():
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on the server.")

    try:
        claims = id_token.verify_oauth2_token(
            request.credential, google_requests.Request(), client_id
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Google could not verify this sign-in. Please try again.")
    except TransportError:
        raise HTTPException(status_code=503, detail="Google sign-in is temporarily unavailable. Please try again.")

    if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Invalid Google account issuer.")
    if claims.get("email_verified") is not True or not claims.get("sub") or not claims.get("email"):
        raise HTTPException(status_code=401, detail="Use a Google account with a verified email address.")

    user = db.query(models.User).filter(models.User.google_sub == claims["sub"]).first()
    welcome_email_sent = False
    if user is None:
        user = models.User(
            google_sub=claims["sub"],
            email=claims["email"].lower(),
            name=claims.get("name") or claims["email"].split("@")[0],
            picture=claims.get("picture"),
        )
        db.add(user)
        try:
            db.commit()
        except Exception:
            db.rollback()
            user = db.query(models.User).filter(models.User.google_sub == claims["sub"]).first()
            if user is None:
                raise HTTPException(status_code=409, detail="Unable to create your account. Please try again.")
        else:
            db.refresh(user)
            welcome_email_sent = send_welcome_email(user)

    return {
        "access_token": create_session_token(user),
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture},
        "welcome_email_sent": welcome_email_sent,
    }


@app.get("/api/auth/me")
def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    user = get_session_user(authorization, db)
    return {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}


def send_order_confirmation_email(order: models.Order, items: list[dict]) -> bool:
    api_key = os.getenv("MAILGUN_API_KEY", "").strip()
    domain = os.getenv("MAILGUN_DOMAIN", "").strip()
    sender = os.getenv("MAILGUN_FROM", "").strip()
    if not api_key or not domain or not sender:
        print("Mailgun is not configured; order confirmation email skipped.")
        return False

    base_url = os.getenv("MAILGUN_BASE_URL", "https://api.mailgun.net").strip().rstrip("/")
    item_lines = [
        f"- {item['product'].name} x{item['quantity']} — NGN {item['line_total']:,.2f}"
        for item in items
    ]
    body = "\n".join([
        f"Hello {order.customer_name},",
        "",
        "Thank you for your order. We have received it and its payment is currently pending.",
        "We will update you when your payment is confirmed.",
        "",
        f"Order number: {order.order_number}",
        f"Payment method: {order.payment_method}",
        "",
        "Items:",
        *item_lines,
        "",
        f"Subtotal: NGN {order.subtotal:,.2f}",
        f"Delivery: NGN {order.delivery_fee:,.2f}",
        f"Total: NGN {order.total:,.2f}",
        "",
        "Noir Scents",
    ])

    try:
        response = requests.post(
            f"{base_url}/v3/{domain}/messages",
            auth=("api", api_key),
            data={
                "from": sender,
                "to": order.customer_email,
                "subject": f"Order confirmation: {order.order_number}",
                "text": body,
            },
            timeout=10,
        )
        response.raise_for_status()
        return True
    except requests.RequestException as error:
        status_code = getattr(getattr(error, "response", None), "status_code", None)
        print(f"Mailgun order confirmation failed (HTTP {status_code or 'request error'}).")
        return False


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
    requested_quantities = {}

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

            requested_quantities[requested_item.product_id] = (
                requested_quantities.get(requested_item.product_id, 0)
                + requested_item.quantity
            )

        for product_id in sorted(requested_quantities):
            quantity = requested_quantities[product_id]
            product = (
                db.query(models.Product)
                .filter(
                    models.Product.id == product_id,
                    models.Product.active == True,
                )
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Product {product_id} "
                        "was not found."
                    ),
                )

            # ---------------------------------------------
            # Check stock
            # ---------------------------------------------

            if product.stock < quantity:
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
                product.price * quantity
            )

            subtotal += line_total

            order_items.append(
                {
                    "product": product,
                    "quantity": quantity,
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

            stock_update = db.execute(
                update(models.Product)
                .where(
                    models.Product.id == product.id,
                    models.Product.active == True,
                    models.Product.stock >= quantity,
                )
                .values(stock=models.Product.stock - quantity)
                .execution_options(synchronize_session=False)
            )
            if stock_update.rowcount != 1:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"Stock for {product.name} changed while completing "
                        "your order. Please refresh your cart and try again."
                    ),
                )

            order_item = models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity,
                line_total=line_total,
            )

            db.add(order_item)

        # -------------------------------------------------
        # Save everything
        # -------------------------------------------------

        db.commit()
        db.refresh(order)

        confirmation_email_sent = send_order_confirmation_email(order, order_items)

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
            "confirmation_email_sent": confirmation_email_sent,
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
