from decimal import Decimal

from .database import SessionLocal, engine, Base
from .models import Product


products = [
    ("His Confession", "Lattafa", "Men", "100ml", 35000, "EDP"),
    ("Her Confession", "Lattafa", "Women", "100ml", 35000, "EDP"),
    ("9PM", "Afnan", "Men", "100ml", 65000, "EDP"),
    ("9PM Rebel", "Afnan", "Unisex", "100ml", 65000, "EDP"),
    ("9PM Night Out", "Afnan", "Men", "100ml", 65000, "EDP"),
    ("Supremacy", "Afnan", "Men", "100ml", 95000, "EDP"),
    ("Supremacy Not Only Intense", "Afnan", "Men", "100ml", 100000, "EDP"),
    ("Asad", "Lattafa", "Men", "100ml", 40000, "EDP"),
    ("Asad Zanzibar", "Lattafa", "Men", "100ml", 42000, "EDP"),
    ("Oud Al Layl", "Lattafa", "Unisex", "100ml", 30000, "Oud"),
    ("Oud for Glory", "Lattafa", "Unisex", "100ml", 45000, "Oud"),
    ("Bade’e Al Oud", "Lattafa", "Unisex", "100ml", 40000, "Oud"),
    ("Bade’e Al Oud Amethyst", "Lattafa", "Unisex", "100ml", 42000, "Oud"),
    ("Khamrah", "Lattafa", "Unisex", "100ml", 50000, "EDP"),
    ("Khamrah Qahwa", "Lattafa", "Unisex", "100ml", 55000, "EDP"),
    ("Fakhar Black", "Lattafa", "Men", "100ml", 40000, "EDP"),
    ("Fakhar Rose", "Lattafa", "Women", "100ml", 40000, "EDP"),
    ("Yara", "Lattafa", "Women", "100ml", 40000, "EDP"),
    ("Yara Moi", "Lattafa", "Women", "100ml", 42000, "EDP"),
    ("Yara Tous", "Lattafa", "Women", "100ml", 42000, "EDP"),
    ("Qaed Al Fursan", "Lattafa", "Unisex", "90ml", 35000, "EDP"),
    ("Ameer Al Oudh Intense Oud", "Lattafa", "Unisex", "100ml", 38000, "Oud"),
    ("Club de Nuit Intense Man", "Armaf", "Men", "105ml", 65000, "EDP"),
    ("Club de Nuit Woman", "Armaf", "Women", "105ml", 55000, "EDP"),
    ("Tres Nuit", "Armaf", "Men", "100ml", 45000, "EDP"),
    ("Iconic", "Armaf", "Men", "100ml", 60000, "EDP"),
    ("24K Magic", None, "Unisex", "100ml", 8000, "EDP"),
    ("Valiance", None, "Unisex", "100ml", 12000, "EDP"),
    ("Miss Koko", None, "Women", "100ml", 10000, "EDP"),
    ("Smart Collection", "Smart Collection", "Unisex", "25ml", 8000, "Inspired"),
    ("Dark Temptation", "Axe", "Men", "150ml", 25000, "Body Spray"),
    ("Ignite", None, "Unisex", "200ml", 8000, "Body Spray"),
    ("Brown Orchid", None, "Women", "200ml", 8000, "Body Spray"),
    ("Bare Vanilla", "Victoria's Secret", "Women", "250ml", 35000, "Body Mist"),
    ("Love Spell", "Victoria's Secret", "Women", "250ml", 35000, "Body Mist"),
    ("Pure Seduction", "Victoria's Secret", "Women", "250ml", 35000, "Body Mist"),
    ("NIVEA Roll-On", "NIVEA", "Unisex", "50ml", 2500, "Roll-On"),
    ("NIVEA Body Spray", "NIVEA", "Unisex", "150ml", 5000, "Body Spray"),
    ("Sure Body Spray", "Sure", "Unisex", "150ml", 5000, "Body Spray"),
    ("Sure Roll-On", "Sure", "Unisex", "50ml", 5000, "Roll-On"),
    ("Dove Roll-On", "Dove", "Unisex", "50ml", 2500, "Roll-On"),
    ("Oud Mood", "Lattafa", "Unisex", "100ml", 35000, "Oud"),
    ("Oud Mood Elixir", "Lattafa", "Unisex", "100ml", 38000, "Oud"),
    ("Raghba", "Lattafa", "Unisex", "100ml", 35000, "EDP"),
    ("Musk Mood", "Lattafa", "Unisex", "100ml", 30000, "Musk"),
    ("Musk Tahara", None, "Unisex", "12ml", 10000, "Musk Oil"),
    ("Sheikh Al Shuyukh", "Lattafa", "Men", "100ml", 35000, "EDP"),
    ("Shaghaf Oud", "Swiss Arabian", "Unisex", "75ml", 55000, "Oud"),
    ("Shaghaf Oud Aswad", "Swiss Arabian", "Unisex", "75ml", 60000, "Oud"),
]


def seed_products():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        existing = db.query(Product).count()

        if existing > 0:
            print(f"Database already contains {existing} products.")
            print("No products were added.")
            return

        for name, brand, gender, size, price, category in products:
            product = Product(
                name=name,
                brand=brand,
                gender=gender,
                size=size,
                price=Decimal(str(price)),
                category=category,
                stock=100,
                active=True,
            )

            db.add(product)

        db.commit()

        print(f"Successfully added {len(products)} Noir_scents products.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_products()