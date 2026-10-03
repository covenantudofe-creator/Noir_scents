import React, { useEffect, useMemo, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "")
).replace(/\/$/, "");
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=85";

/*
============================================================
LOCAL PERFUME IMAGES
============================================================

Put your images here:

frontend/public/perfumes/

Example:

frontend/public/perfumes/her-confession.jpg
frontend/public/perfumes/his-confession.jpg
frontend/public/perfumes/9pm-night-out.jpg
frontend/public/perfumes/9pm-rebel.jpg
frontend/public/perfumes/supremacy.jpg
frontend/public/perfumes/club-de-nuit-intense.jpg

The product name on the left MUST match the name
returned by your FastAPI /api/products endpoint.
*/

const LOCAL_IMAGES = {
  "Her Confession": "/perfumes/her-confession.jpg",
  "His Confession": "/perfumes/his-confession.jpg",
  "9PM Night Out": "/perfumes/9pm-night-out.jpg",
  "9PM Rebel": "/perfumes/9pm-rebel.jpg",
  "Supremacy": "/perfumes/supremacy.jpg",
  "Club de Nuit Intense Man":
    "/perfumes/club-de-nuit-intense-man.jpg",
    "Club de Nuit Woman":
    "/perfumes/club-de-nuit-intense-woman.jpg",
  "Sheikh Al Shuyukh":
    "/perfumes/sheikh-al-shuyukh.jpg",
  "Oud Mood Elixir":
    "/perfumes/oud-mood-elixir.jpg",
    "Oud Al Layl":
    "/perfumes/oud-al-layl.jpg",
  "Musk Mood":
    "/perfumes/musk-mood.jpg",
  "9PM":
    "/perfumes/9pm.jpg",
  "Raghba":
    "/perfumes/raghba.jpg",
  "Musk Tahara":
    "/perfumes/musk-tahara.jpg",
    "Miss Kiki":
    "/perfumes/miss-kiki.jpg",
  "Sure Roll-On":
    "/perfumes/sure-roll-on.jpg",
  "Dove Roll-On":
    "/perfumes/dove-roll-on.jpg",
    "Supremacy Not Only Intense":
    "/perfumes/supremacy-not-only-intense.jpg",
    "Bade’e Al Oud":
    "/perfumes/badee-al-oud.jpg",
    "Fakhar Black":
    "/perfumes/fakhar-black.jpg",
    "Yara":
    "/perfumes/yara.jpg",
    "Yara Tous":
    "/perfumes/yara-tous.jpg",
    "Valiance":
    "/perfumes/valiance.jpg",
    "Ignite":
    "/perfumes/ignite.jpg",
   "24K Magic":
    "/perfumes/24kmagic.jpg",
    "Smart Collection":
    "/perfumes/smart-collection.jpg",
   "Qaed Al Fursan":
   "/perfumes/qaed-al-fursan.jpg", 
    "Ameer Al Oudh Intense Oud":
    "/perfumes/ameer-al-oudh.jpg",
  "Asad": "/perfumes/Asad.jpg",
  "Asad Zanzibar": "/perfumes/asad-zanzibar.jpg",
  "Bade’e Al Oud Amethyst": "/perfumes/badee-al-oud-amethyst.jpg",
  "Bare Vanilla": "/perfumes/bare-vanilla.jpg",
  "Brown Orchid": "/perfumes/brown-orchid.jpg",
  "Dark Temptation": "/perfumes/dark-tempation.jpg",
  "Fakhar Rose": "/perfumes/fakhar-rose.jpg",
  "Khamrah Qahwa": "/perfumes/Khamrah%20Qahwa.jpg",
  "Love Spell": "/perfumes/love-spell.jpg",
  "NIVEA Body Spray": "/perfumes/nivea-body-spray.jpg",
  "NIVEA Roll-On": "/perfumes/nivea-roll-on.jpg",
  "Oud for Glory": "/perfumes/oud-for-glory.jpg",
  "Oud Mood": "/perfumes/Oud-mood.jpg",
  "Shaghaf Oud Aswad": "/perfumes/shaghaf-oud-aswad.jpg",
  "Tres Nuit": "/perfumes/tres-nuit.jpg",
  "Yara Moi": "/perfumes/yara-moi.jpg",


};

async function readApiResponse(response) {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }

  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((issue) => issue.msg).filter(Boolean).join(" ")
      : detail;
    throw new Error(message || `Server returned ${response.status}.`);
  }

  return data;
}

/*
============================================================
IMAGE HELPER
============================================================
*/

function getProductImage(product) {
  if (!product) {
    return FALLBACK_IMAGE;
  }

  // Local images have priority over Neon image URLs.
  if (LOCAL_IMAGES[product.name]) {
    return LOCAL_IMAGES[product.name];
  }

  // If there is no local image mapping, use the database URL.
  if (product.image_url) {
    return product.image_url;
  }

  return FALLBACK_IMAGE;
}

/*
============================================================
ICONS
============================================================
*/

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ShoppingBagIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

/*
============================================================
HELPERS
============================================================
*/

function formatPrice(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(number);
}

/*
============================================================
PRODUCT CARD
============================================================
*/

function ProductCard({
  product,
  onAddToCart,
  onQuickView,
}) {
  const image = getProductImage(product);
  const isOutOfStock = Number(product.stock || 0) <= 0;

  return (
    <article className="product-card">
      <div
        className="product-image-wrapper"
        onClick={() => onQuickView(product)}
      >
        <img
          src={image}
          alt={product.name}
          className="product-image"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <div className="product-overlay">
          <button
            className="quick-view-button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickView(product);
            }}
          >
            Quick View
          </button>
        </div>

        {isOutOfStock && (
          <div className="stock-badge out-of-stock">
            Sold Out
          </div>
        )}
      </div>

      <div className="product-info">
        <div className="product-category">
          {product.category ||
            product.gender ||
            "Fragrance"}
        </div>

        <h3>{product.name}</h3>

        <p className="product-size">
          {product.size || "100ml"}
        </p>

        <div className="product-bottom">
          <span className="product-price">
            {formatPrice(product.price)}
          </span>

          <button
            className="add-button"
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

/*
============================================================
PRODUCT GRID
============================================================
*/

function ProductGrid({
  products,
  loading,
  error,
  onAddToCart,
  onQuickView,
}) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>Loading fragrances...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Unable to load perfumes</h3>
        <p>{error}</p>
        <p>
          Make sure your FastAPI backend is running on
          port 8000.
        </p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="empty-state">
        <h3>No perfumes found</h3>
        <p>Try another search or category.</p>
      </div>
    );
  }

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  );
}

/*
============================================================
MAIN APP
============================================================
*/

export default function App() {
  const [page, setPage] = useState("home");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] =
    useState(true);
  const [productsError, setProductsError] =
    useState("");

  const [cart, setCart] = useState([]);

  const [mobileMenu, setMobileMenu] =
    useState(false);
  const [searchOpen, setSearchOpen] =
    useState(false);
  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [orderSubmitted, setOrderSubmitted] =
    useState(false);
  const [orderNumber, setOrderNumber] =
    useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState("paystack");

  const [checkoutForm, setCheckoutForm] =
    useState({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      delivery_address: "",
      city: "",
      state: "",
    });

  useEffect(() => {
    const token = sessionStorage.getItem("noir_session");
    if (!token) return;

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(readApiResponse)
      .then((user) => {
        setAuthUser(user);
        setCheckoutForm((current) => ({
          ...current,
          customer_name: current.customer_name || user.name || "",
          customer_email: current.customer_email || user.email || "",
        }));
      })
      .catch(() => {
        sessionStorage.removeItem("noir_session");
      });
  }, []);

  useEffect(() => {
    if (!authDialogOpen || !GOOGLE_CLIENT_ID) return;

    const initializeGoogleButton = () => {
      const buttonContainer = document.getElementById("google-signin-button");
      if (!buttonContainer || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setAuthLoading(true);
          setAuthError("");
          try {
            const response = await fetch(`${API_URL}/api/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const result = await readApiResponse(response);
            sessionStorage.setItem("noir_session", result.access_token);
            setAuthUser(result.user);
            setCheckoutForm((current) => ({
              ...current,
              customer_name: current.customer_name || result.user.name || "",
              customer_email: current.customer_email || result.user.email || "",
            }));
            setAuthDialogOpen(false);
          } catch (error) {
            setAuthError(error.message || "Google sign-in failed. Please try again.");
          } finally {
            setAuthLoading(false);
          }
        },
      });
      buttonContainer.replaceChildren();
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 280,
      });
    };

    let script = document.getElementById("google-identity-services");
    if (window.google?.accounts?.id) {
      initializeGoogleButton();
    } else {
      if (!script) {
        script = document.createElement("script");
        script.id = "google-identity-services";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", initializeGoogleButton, { once: true });
    }
  }, [authDialogOpen]);

  function signOut() {
    sessionStorage.removeItem("noir_session");
    setAuthUser(null);
  }

  /*
  ============================================================
  LOAD PRODUCTS
  ============================================================
  */

  useEffect(() => {
    async function loadProducts() {
      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await fetch(`${API_URL}/api/products`);
        const data = await readApiResponse(response);

        if (!Array.isArray(data)) {
          throw new Error("The products endpoint returned an invalid response.");
        }

        const formattedProducts =
          Array.isArray(data)
            ? data.map((product) => ({
                id: product.id,
                name:
                  product.name ||
                  "Unnamed Perfume",
                brand:
                  product.brand ||
                  "Noir_scents",
                gender:
                  product.gender ||
                  "Unisex",
                size:
                  product.size ||
                  "100ml",
                price: Number(
                  product.price || 0
                ),
                category:
                  product.category ||
                  product.gender ||
                  "Fragrance",
                image_url:
                  product.image_url || "",
                stock: Number(
                  product.stock || 0
                ),
                description:
                  product.description ||
                  "A carefully selected fragrance from Noir_scents.",
              }))
          : [];

        setProducts(formattedProducts);
      } catch (error) {
        console.error(
          "PRODUCT LOAD ERROR:",
          error
        );

        setProductsError(error.message || "Could not connect to the Noir_scents server.");
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, []);

  /*
  ============================================================
  LOCK BODY SCROLL WHEN MODAL IS OPEN
  ============================================================
  */

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProduct]);

  /*
  ============================================================
  CART
  ============================================================
  */

  function addToCart(product) {
    if (Number(product.stock || 0) <= 0) {
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (
          existing.quantity >=
          Number(product.stock || 0)
        ) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(
    productId,
    quantity
  ) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        const safeQuantity = Math.max(
          1,
          Math.min(
            quantity,
            Number(item.stock || 1)
          )
        );

        return {
          ...item,
          quantity: safeQuantity,
        };
      })
    );
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.id !== productId
      )
    );
  }

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );
  }, [cart]);

  /*
  ============================================================
  NAVIGATION
  ============================================================
  */

  function goTo(nextPage) {
    setPage(nextPage);
    setMobileMenu(false);
    setSearchOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
  ============================================================
  SEARCH
  ============================================================
  */

  const filteredProducts = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return products;
    }

    return products.filter((product) => {
      const name = String(
        product.name || ""
      ).toLowerCase();

      const brand = String(
        product.brand || ""
      ).toLowerCase();

      const category = String(
        product.category || ""
      ).toLowerCase();

      return (
        name.includes(searchValue) ||
        brand.includes(searchValue) ||
        category.includes(searchValue)
      );
    });
  }, [products, search]);

  /*
  ============================================================
  CHECKOUT
  ============================================================
  */

  function handleCheckoutChange(event) {
    const { name, value } = event.target;

    setCheckoutForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submitOrder(event) {
    event.preventDefault();

    if (!cart.length || orderSubmitting) {
      return;
    }

    setOrderSubmitting(true);
    setOrderError("");
    try {
      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...checkoutForm,
            payment_method: paymentMethod,
            items: cart.map((item) => ({
              product_id: item.id,
              quantity: item.quantity,
            })),
          }),
        }
      );

      const data = await readApiResponse(response);

      setOrderNumber(
        data.order_number || ""
      );

      setOrderSubmitted(true);
      setCart([]);
      setProducts((current) => current.map((product) => {
        const purchased = cart.find((item) => item.id === product.id);
        return purchased
          ? { ...product, stock: Math.max(0, product.stock - purchased.quantity) }
          : product;
      }));

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "ORDER ERROR:",
        error
      );

      setOrderError(error.message || "Something went wrong while creating your order.");
    } finally {
      setOrderSubmitting(false);
    }
  }

  /*
  ============================================================
  HOME
  ============================================================
  */

  function HomePage() {
    const featuredProducts =
      products.slice(0, 8);

    const heroProduct =
      featuredProducts[0];

    return (
      <>
        <section className="hero-section">
          <div className="hero-content">
            <p className="eyebrow">
              THE ART OF FRAGRANCE
            </p>

            <h1>
              Leave a lasting
              <br />
              <span>impression.</span>
            </h1>

            <p className="hero-description">
              Discover carefully selected
              fragrances designed to become
              part of your identity.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() =>
                  goTo("shop")
                }
              >
                Shop Collection
                <ArrowIcon />
              </button>

              <button
                className="text-button"
                onClick={() =>
                  goTo("about")
                }
              >
                Discover Noir_scents
              </button>
            </div>
          </div>

          <div className="hero-image-container">
            <img
              src={
                heroProduct
                  ? getProductImage(
                      heroProduct
                    )
                  : FALLBACK_IMAGE
              }
              alt="Luxury perfume"
              className="hero-image"
              onError={(event) => {
                event.currentTarget.onerror =
                  null;
                event.currentTarget.src =
                  FALLBACK_IMAGE;
              }}
            />
          </div>
        </section>

        <section className="brand-strip">
          <div>
            <strong>CURATED</strong>
            <span>
              Premium fragrances
            </span>
          </div>

          <div>
            <strong>AUTHENTIC</strong>
            <span>
              Quality guaranteed
            </span>
          </div>

          <div>
            <strong>DELIVERY</strong>
            <span>
              Across Nigeria
            </span>
          </div>

          <div>
            <strong>NOIR</strong>
            <span>
              Your signature scent
            </span>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                THE COLLECTION
              </p>

              <h2>
                Fragrances worth
                <br />
                remembering.
              </h2>
            </div>

            <button
              className="outline-button"
              onClick={() =>
                goTo("shop")
              }
            >
              View All
              <ArrowIcon />
            </button>
          </div>

          <ProductGrid
            products={featuredProducts}
            loading={productsLoading}
            error={productsError}
            onAddToCart={addToCart}
            onQuickView={
              setSelectedProduct
            }
          />
        </section>

        <section className="story-section">
          <div className="story-image">
            <img
              src={
                heroProduct
                  ? getProductImage(
                      heroProduct
                    )
                  : FALLBACK_IMAGE
              }
              alt="Noir fragrance"
              onError={(event) => {
                event.currentTarget.onerror =
                  null;
                event.currentTarget.src =
                  FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="story-content">
            <p className="eyebrow">
              OUR PHILOSOPHY
            </p>

            <h2>
              Scent is more
              <br />
              than fragrance.
            </h2>

            <p>
              At Noir_scents, we believe the
              right fragrance can become part
              of your identity. It can remind
              someone of you, change your mood
              and leave an impression long
              after you've left.
            </p>

            <button
              className="text-button"
              onClick={() =>
                goTo("about")
              }
            >
              Our Story
              <ArrowIcon />
            </button>
          </div>
        </section>
      </>
    );
  }

  /*
  ============================================================
  SHOP
  ============================================================
  */

  function ShopPage() {
    return (
      <section className="page-section">
        <div className="page-header">
          <p className="eyebrow">
            NOIR_SCENTS
          </p>

          <h1>The Collection</h1>

          <p>
            Explore our collection of
            fragrances selected for every
            mood and occasion.
          </p>
        </div>

        <div className="shop-toolbar">
          <span>
            {filteredProducts.length}{" "}
            fragrance
            {filteredProducts.length ===
            1
              ? ""
              : "s"}
          </span>

          <div className="shop-search">
            <SearchIcon />

            <input
              type="text"
              placeholder="Search fragrances..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <ProductGrid
          products={filteredProducts}
          loading={productsLoading}
          error={productsError}
          onAddToCart={addToCart}
          onQuickView={
            setSelectedProduct
          }
        />
      </section>
    );
  }

  /*
  ============================================================
  COLLECTIONS
  ============================================================
  */

  function CollectionsPage() {
    const categories = [
      {
        title: "For Him",
        description:
          "Bold, refined and confident fragrances.",
        category: "Men",
      },
      {
        title: "For Her",
        description:
          "Elegant, sensual and unforgettable scents.",
        category: "Women",
      },
      {
        title: "Unisex",
        img: "https://i.pinimg.com/1200x/7e/e0/35/7ee03552cce4ae19065fad7707e9f43c.jpg",
        description:
          "Versatile fragrances designed for everyone.",
        category: "Unisex",
      },
    ];

    return (
      <section className="page-section">
        <div className="page-header">
          <p className="eyebrow">
            EXPLORE
          </p>

          <h1>Collections</h1>

          <p>
            Find the fragrance that speaks
            to you.
          </p>
        </div>

        <div className="collection-grid">
          {categories.map(
            (collection) => {
              const collectionProducts =
                products.filter(
                  (product) =>
                    String(
                      product.gender ||
                        ""
                    ).toLowerCase() ===
                    collection.category.toLowerCase()
                );

              return (
                <div
                  className="collection-card"
                  key={collection.title}
                >
                  <div className="collection-card-image">
                    <img
                      src={
                        collectionProducts[0]
                          ? getProductImage(
                              collectionProducts[0]
                            )
                          : FALLBACK_IMAGE
                      }
                      alt={
                        collection.title
                      }
                      onError={(
                        event
                      ) => {
                        event.currentTarget.onerror =
                          null;
                        event.currentTarget.src =
                          FALLBACK_IMAGE;
                      }}
                    />
                  </div>

                  <div className="collection-card-content">
                    <p className="eyebrow">
                      {
                        collection.category
                      }
                    </p>

                    <h2>
                      {collection.title}
                    </h2>

                    <p>
                      {
                        collection.description
                      }
                    </p>

                    <button
                      className="text-button"
                      onClick={() =>
                        goTo("shop")
                      }
                    >
                      Explore
                      <ArrowIcon />
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </section>
    );
  }

  /*
  ============================================================
  ABOUT
  ============================================================
  */

  function AboutPage() {
    const aboutProduct = products[0];

    return (
      <section className="page-section">
        <div className="page-header">
          <p className="eyebrow">
            ABOUT NOIR_SCENTS
          </p>

          <h1>
            Fragrance with character.
          </h1>

          <p>
            Noir_scents is a fragrance store
            built around individuality,
            confidence and memorable scent.
          </p>
        </div>

        <div className="about-layout">
          <div className="about-image">
            <img
              src={
                aboutProduct
                  ? getProductImage(
                      aboutProduct
                    )
                  : FALLBACK_IMAGE
              }
              alt="Noir_scents fragrance"
              onError={(event) => {
                event.currentTarget.onerror =
                  null;
                event.currentTarget.src =
                  FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="about-text">
            <p className="eyebrow">
              OUR STORY
            </p>

            <h2>
              Find the scent
              <br />
              that feels like you.
            </h2>

            <p>
              Your fragrance should feel
              personal. It should fit your
              personality, your lifestyle and
              the moments you want people to
              remember.
            </p>

            <p>
              Noir_scents brings together a
              carefully selected range of
              fragrances so you can discover
              scents that feel uniquely yours.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                goTo("shop")
              }
            >
              Shop Fragrances
              <ArrowIcon />
            </button>
          </div>
        </div>
      </section>
    );
  }

  /*
  ============================================================
  CONTACT
  ============================================================
  */

  function ContactPage() {
    return (
      <section className="page-section">
        <div className="page-header">
          <p className="eyebrow">
            CUSTOMER SERVICE
          </p>

          <h1>
            We're here to help.
          </h1>

          <p>
            Have a question about an order
            or fragrance? Get in touch with
            us.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <span className="contact-number">
              01
            </span>

            <h3>WhatsApp</h3>

            <p>
              Chat with our customer service
              team.
            </p>

            <a
              href="https://wa.me/"
              target="_blank"
              rel="noreferrer"
            >
              Start a conversation
              <ArrowIcon />
            </a>
          </div>

          <div className="contact-card">
            <span className="contact-number">
              02
            </span>

            <h3>Email</h3>

            <p>
              Send us your questions and we'll
              get back to you.
            </p>

            <a href="mailto:hello@noirscents.com">
              hello@noirscents.com
              <ArrowIcon />
            </a>
          </div>

          <div className="contact-card">
            <span className="contact-number">
              03
            </span>

            <h3>Orders</h3>

            <p>
              Need help with an existing
              order?
            </p>

            <button
              className="text-button"
              onClick={() =>
                goTo("shop")
              }
            >
              Continue Shopping
              <ArrowIcon />
            </button>
          </div>
        </div>
      </section>
    );
  }

  /*
  ============================================================
  CART
  ============================================================
  */

  function CartPage() {
    if (!cart.length) {
      return (
        <section className="page-section cart-page">
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBagIcon />
            </div>

            <p className="eyebrow">
              YOUR BAG
            </p>

            <h1>
              Your bag is empty.
            </h1>

            <p>
              Discover something you'll
              love.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                goTo("shop")
              }
            >
              Shop Fragrances
              <ArrowIcon />
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="page-section cart-page">
        <div className="page-header page-header-left">
          <p className="eyebrow">
            YOUR BAG
          </p>

          <h1>
            Your Shopping Bag
          </h1>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div
                className="cart-item"
                key={item.id}
              >
                <img
                  src={getProductImage(
                    item
                  )}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.onerror =
                      null;
                    event.currentTarget.src =
                      FALLBACK_IMAGE;
                  }}
                />

                <div className="cart-item-info">
                  <p className="eyebrow">
                    {item.category ||
                      item.gender ||
                      "Fragrance"}
                  </p>

                  <h3>{item.name}</h3>

                  <p>
                    {item.size ||
                      "100ml"}
                  </p>

                  <button
                    className="remove-button"
                    onClick={() =>
                      removeFromCart(
                        item.id
                      )
                    }
                  >
                    <TrashIcon />
                    Remove
                  </button>
                </div>

                <div className="cart-item-right">
                  <strong>
                    {formatPrice(
                      Number(
                        item.price
                      ) *
                        Number(
                          item.quantity
                        )
                    )}
                  </strong>

                  <div className="quantity-control">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity -
                            1
                        )
                      }
                      disabled={
                        item.quantity <=
                        1
                      }
                    >
                      <MinusIcon />
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.quantity +
                            1
                        )
                      }
                      disabled={
                        item.quantity >=
                        Number(
                          item.stock || 1
                        )
                      }
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="cart-summary">
            <p className="eyebrow">
              SUMMARY
            </p>

            <h2>Your Order</h2>

            <div className="summary-line">
              <span>Subtotal</span>

              <strong>
                {formatPrice(
                  cartTotal
                )}
              </strong>
            </div>

            <div className="summary-line">
              <span>Delivery</span>

              <span>
                Calculated at checkout
              </span>
            </div>

            <div className="summary-total">
              <span>Total</span>

              <strong>
                {formatPrice(
                  cartTotal
                )}
              </strong>
            </div>

            <button
              className="primary-button full-width"
              onClick={() =>
                goTo("checkout")
              }
            >
              Checkout
              <ArrowIcon />
            </button>
          </aside>
        </div>
      </section>
    );
  }

  /*
  ============================================================
  CHECKOUT
  ============================================================
  */

  function CheckoutPage() {
    if (orderSubmitted) {
      return (
        <section className="page-section">
          <div className="success-page">
            <div className="success-icon">
              ✓
            </div>

            <p className="eyebrow">
              ORDER RECEIVED
            </p>

            <h1>
              Thank you for your order.
            </h1>

            <p>
              Your order was saved with pending payment status. Payment has not been confirmed yet.
            </p>

            {orderNumber && (
              <div className="order-number">
                <span>
                  Order Number
                </span>

                <strong>
                  {orderNumber}
                </strong>
              </div>
            )}

            <button
              className="primary-button"
              onClick={() => {
                setOrderSubmitted(
                  false
                );
                goTo("shop");
              }}
            >
              Continue Shopping
              <ArrowIcon />
            </button>
          </div>
        </section>
      );
    }

    if (!cart.length) {
      return (
        <section className="page-section">
          <div className="empty-cart">
            <p className="eyebrow">
              CHECKOUT
            </p>

            <h1>
              Your cart is empty.
            </h1>

            <button
              className="primary-button"
              onClick={() =>
                goTo("shop")
              }
            >
              Shop Now
              <ArrowIcon />
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="page-section checkout-page">
        <div className="page-header page-header-left">
          <p className="eyebrow">
            CHECKOUT
          </p>

          <h1>
            Complete your order.
          </h1>
        </div>

        <div className="checkout-layout">
          <form
            className="checkout-form"
            onSubmit={submitOrder}
          >
            <div className="checkout-section">
              <p className="eyebrow">
                CUSTOMER DETAILS
              </p>

              <h2>
                Your Information
              </h2>

              <div className="form-grid">
                <label>
                  Full Name

                  <input
                    type="text"
                    name="customer_name"
                    value={
                      checkoutForm.customer_name
                    }
                    onChange={
                      handleCheckoutChange
                    }
                    placeholder="Your full name"
                    required
                  />
                </label>

                <label>
                  Email Address

                  <input
                    type="email"
                    name="customer_email"
                    value={
                      checkoutForm.customer_email
                    }
                    onChange={
                      handleCheckoutChange
                    }
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label>
                  Phone Number

                  <input
                    type="tel"
                    name="customer_phone"
                    value={
                      checkoutForm.customer_phone
                    }
                    onChange={
                      handleCheckoutChange
                    }
                    placeholder="08012345678"
                    required
                  />
                </label>

                <label>
                  City

                  <input
                    type="text"
                    name="city"
                    value={
                      checkoutForm.city
                    }
                    onChange={
                      handleCheckoutChange
                    }
                    placeholder="City"
                  />
                </label>

                <label>
                  State

                  <input
                    type="text"
                    name="state"
                    value={
                      checkoutForm.state
                    }
                    onChange={
                      handleCheckoutChange
                    }
                    placeholder="State"
                  />
                </label>

                <label className="full-field">
                  Delivery Address

                  <textarea
                    name="delivery_address"
                    value={
                      checkoutForm.delivery_address
                    }
                    onChange={
                      handleCheckoutChange
                    }
                    placeholder="Enter your full delivery address"
                    rows="4"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="checkout-section">
              <p className="eyebrow">
                PAYMENT
              </p>

              <h2>
                Choose Payment Method
              </h2>

              <div className="payment-options">
                <label
                  className={`payment-option ${
                    paymentMethod ===
                    "paystack"
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="paystack"
                    checked={
                      paymentMethod ===
                      "paystack"
                    }
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value
                      )
                    }
                  />

                  <div>
                    <strong>
                      Paystack
                    </strong>

                    <span>
                      Card, transfer and
                      other supported
                      methods
                    </span>
                  </div>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod ===
                    "flutterwave"
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="flutterwave"
                    checked={
                      paymentMethod ===
                      "flutterwave"
                    }
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value
                      )
                    }
                  />

                  <div>
                    <strong>
                      Flutterwave
                    </strong>

                    <span>
                      Secure online
                      payment
                    </span>
                  </div>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod ===
                    "opay"
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="opay"
                    checked={
                      paymentMethod ===
                      "opay"
                    }
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value
                      )
                    }
                  />

                  <div>
                    <strong>
                      OPay
                    </strong>

                    <span>
                      Pay using OPay
                    </span>
                  </div>
                </label>

                <label
                  className={`payment-option ${
                    paymentMethod ===
                    "bank"
                      ? "selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={
                      paymentMethod ===
                      "bank"
                    }
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target
                          .value
                      )
                    }
                  />

                  <div>
                    <strong>
                      Bank Transfer
                    </strong>

                    <span>
                      Pay directly via
                      bank transfer
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button full-width checkout-submit"
              disabled={orderSubmitting}
            >
              {orderSubmitting ? "Submitting order..." : "Place Order"}
              <ArrowIcon />
            </button>
            {orderError && (
              <p className="checkout-error" role="alert">{orderError}</p>
            )}
          </form>

          <aside className="checkout-summary">
            <p className="eyebrow">
              ORDER SUMMARY
            </p>

            <h2>Your Order</h2>

            <div className="checkout-items">
              {cart.map((item) => (
                <div
                  className="checkout-item"
                  key={item.id}
                >
                  <img
                    src={getProductImage(
                      item
                    )}
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.onerror =
                        null;
                      event.currentTarget.src =
                        FALLBACK_IMAGE;
                    }}
                  />

                  <div>
                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      Qty:{" "}
                      {item.quantity}
                    </span>
                  </div>

                  <strong>
                    {formatPrice(
                      Number(
                        item.price
                      ) *
                        Number(
                          item.quantity
                        )
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div className="summary-line">
              <span>Subtotal</span>

              <strong>
                {formatPrice(
                  cartTotal
                )}
              </strong>
            </div>

            <div className="summary-line">
              <span>Delivery</span>

              <span>
                Calculated later
              </span>
            </div>

            <div className="summary-total">
              <span>Total</span>

              <strong>
                {formatPrice(
                  cartTotal
                )}
              </strong>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  /*
  ============================================================
  PRODUCT MODAL
  ============================================================
  */

  function ProductModal() {
    if (!selectedProduct) {
      return null;
    }

    const image =
      getProductImage(
        selectedProduct
      );

    const inStock =
      Number(
        selectedProduct.stock || 0
      ) > 0;

    return (
      <div
        className="modal-backdrop"
        onClick={() =>
          setSelectedProduct(null)
        }
      >
        <div
          className="product-modal"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <button
            className="modal-close"
            onClick={() =>
              setSelectedProduct(null)
            }
          >
            <CloseIcon />
          </button>

          <div className="modal-image">
            <img
              src={image}
              alt={
                selectedProduct.name
              }
              onError={(event) => {
                event.currentTarget.onerror =
                  null;
                event.currentTarget.src =
                  FALLBACK_IMAGE;
              }}
            />
          </div>

          <div className="modal-content">
            <p className="eyebrow">
              {selectedProduct.category ||
                selectedProduct.gender ||
                "FRAGRANCE"}
            </p>

            <h2>
              {selectedProduct.name}
            </h2>

            <p className="modal-price">
              {formatPrice(
                selectedProduct.price
              )}
            </p>

            <p className="modal-description">
              {selectedProduct.description ||
                "A beautiful fragrance carefully selected by Noir_scents."}
            </p>

            <div className="modal-details">
              <div>
                <span>Size</span>

                <strong>
                  {selectedProduct.size ||
                    "100ml"}
                </strong>
              </div>

              <div>
                <span>
                  Availability
                </span>

                <strong>
                  {inStock
                    ? "In Stock"
                    : "Sold Out"}
                </strong>
              </div>
            </div>

            <button
              className="primary-button full-width"
              disabled={!inStock}
              onClick={() => {
                addToCart(
                  selectedProduct
                );
                setSelectedProduct(
                  null
                );
              }}
            >
              {inStock
                ? "Add to Cart"
                : "Sold Out"}

              <ShoppingBagIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  ============================================================
  FOOTER
  ============================================================
  */

  function Footer() {
    return (
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              NOIR<span>_</span>SCENTS
            </div>

            <p>
              Fragrance that becomes part of
              your identity.
            </p>
          </div>

          <div className="footer-column">
            <h4>Explore</h4>

            <button
              onClick={() =>
                goTo("shop")
              }
            >
              Shop
            </button>

            <button
              onClick={() =>
                goTo("collections")
              }
            >
              Collections
            </button>

            <button
              onClick={() =>
                goTo("about")
              }
            >
              About
            </button>
          </div>

          <div className="footer-column">
            <h4>Help</h4>

            <button
              onClick={() =>
                goTo("contact")
              }
            >
              Customer Service
            </button>

            <button
              onClick={() =>
                goTo("cart")
              }
            >
              Shopping Bag
            </button>

            <button
              onClick={() =>
                goTo("checkout")
              }
            >
              Checkout
            </button>
          </div>

          <div className="footer-column">
            <h4>Follow</h4>

            <a
              href="#"
              onClick={(event) =>
                event.preventDefault()
              }
            >
              Instagram
            </a>

            <a
              href="#"
              onClick={(event) =>
                event.preventDefault()
              }
            >
              TikTok
            </a>

            <a
              href="#"
              onClick={(event) =>
                event.preventDefault()
              }
            >
              Facebook
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()}{" "}
            Noir_scents. All rights
            reserved.
          </span>

          <span>
            Crafted with intention.
          </span>
        </div>
      </footer>
    );
  }

  /*
  ============================================================
  MAIN RENDER
  ============================================================
  */

  return (
    <div className="app">
      <header className="site-header">
        <div className="header-inner">
          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenu(
                !mobileMenu
              )
            }
            aria-label="Menu"
          >
            {mobileMenu ? (
              <CloseIcon />
            ) : (
              <MenuIcon />
            )}
          </button>

          <button
            className="logo"
            onClick={() =>
              goTo("home")
            }
          >
            NOIR<span>_</span>SCENTS
          </button>

          <nav
            className={`main-nav ${
              mobileMenu
                ? "mobile-open"
                : ""
            }`}
          >
            <button
              className={
                page === "home"
                  ? "active"
                  : ""
              }
              onClick={() =>
                goTo("home")
              }
            >
              Home
            </button>

            <button
              className={
                page === "shop"
                  ? "active"
                  : ""
              }
              onClick={() =>
                goTo("shop")
              }
            >
              Shop
            </button>

            <button
              className={
                page === "collections"
                  ? "active"
                  : ""
              }
              onClick={() =>
                goTo("collections")
              }
            >
              Collections
            </button>

            <button
              className={
                page === "about"
                  ? "active"
                  : ""
              }
              onClick={() =>
                goTo("about")
              }
            >
              About
            </button>

            <button
              className={
                page === "contact"
                  ? "active"
                  : ""
              }
              onClick={() =>
                goTo("contact")
              }
            >
              Contact
            </button>
          </nav>

          <div className="header-actions">
            {authUser ? (
              <button className="account-button" onClick={signOut} title={`Signed in as ${authUser.email}`}>
                {authUser.name?.split(" ")[0] || "Account"} · Sign out
              </button>
            ) : (
              <button className="account-button" onClick={() => { setAuthError(""); setAuthDialogOpen(true); }}>
                Sign in
              </button>
            )}
            <button
              className="header-icon"
              onClick={() =>
                setSearchOpen(
                  !searchOpen
                )
              }
              aria-label="Search"
            >
              <SearchIcon />
            </button>

            <button
              className="header-icon cart-icon"
              onClick={() =>
                goTo("cart")
              }
              aria-label="Shopping bag"
            >
              <ShoppingBagIcon />

              {cartCount > 0 && (
                <span className="cart-count">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-panel">
            <div className="search-panel-inner">
              <SearchIcon />

              <input
                autoFocus
                type="text"
                value={search}
                placeholder="Search perfumes..."
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    goTo("shop");
                  }
                }}
              />

              <button
                onClick={() =>
                  setSearchOpen(
                    false
                  )
                }
                aria-label="Close search"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {page === "home" && (
          <HomePage />
        )}

        {page === "shop" && (
          <ShopPage />
        )}

        {page === "collections" && (
          <CollectionsPage />
        )}

        {page === "about" && (
          <AboutPage />
        )}

        {page === "contact" && (
          <ContactPage />
        )}

        {page === "cart" && (
          <CartPage />
        )}

        {page === "checkout" && (
          <CheckoutPage />
        )}
      </main>

      <Footer />

      <ProductModal />

      {authDialogOpen && (
        <div className="modal-backdrop auth-backdrop" onClick={() => setAuthDialogOpen(false)}>
          <section
            className="auth-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setAuthDialogOpen(false)} aria-label="Close sign-in dialog">
              <CloseIcon />
            </button>
            <p className="eyebrow">WELCOME TO NOIR_SCENTS</p>
            <h2 id="auth-dialog-title">Sign in to your account</h2>
            <p className="auth-dialog-copy">Use your Google account to sign in and speed up checkout.</p>
            {GOOGLE_CLIENT_ID ? (
              <div id="google-signin-button" className="google-signin-button" />
            ) : (
              <p className="auth-error">Google sign-in needs a client ID. Set VITE_GOOGLE_CLIENT_ID in frontend/.env.</p>
            )}
            {authLoading && <p className="auth-dialog-copy" role="status">Signing you in…</p>}
            {authError && <p className="auth-error" role="alert">{authError}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
