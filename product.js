const productDetail = document.getElementById("productDetail");

function formatPrice(price) {
  return Number(price).toFixed(2).replace(".", ",") + " €";
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function saveCart(cart) {
  localStorage.setItem("golstyle_cart", JSON.stringify(cart));
}

function addToCart(product, size, quantity) {
  let cart = JSON.parse(localStorage.getItem("golstyle_cart")) || [];

  const existing = cart.find(
    item => item.id === product.id && item.selectedSize === size
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      ...product,
      quantity: quantity,
      selectedSize: size
    });
  }

  saveCart(cart);
  alert("Producto añadido al carrito");
}

async function loadProduct() {
  try {
    const res = await fetch("products.json");
    const products = await res.json();
    const productId = getProductIdFromUrl();
    const product = products.find(p => p.id === productId);

    if (!product) {
      productDetail.innerHTML = `<div class="no-results">Producto no encontrado.</div>`;
      return;
    }

    const availableSizes = product.sizes || ["S", "M", "L", "XL"];

    productDetail.innerHTML = `
      <article class="product-detail-card">
        <div>
          <img src="${product.image}" alt="${product.title}" class="product-detail-image">
        </div>

        <div class="product-detail-content">
          <div class="product-detail-tags">
            <span class="product-tag">${product.team}</span>
            <span class="product-tag">${product.league}</span>
            <span class="product-tag">${product.season}</span>
          </div>

          <h2>${product.title}</h2>
          <p>${product.description}</p>
          <p>${product.longDescription}</p>

          <div class="product-detail-price">${formatPrice(product.price)}</div>

          <div class="product-form-box">
            <div class="form-grid">
              <div class="form-group">
                <label for="sizeSelect">Talla</label>
                <select id="sizeSelect" class="product-select">
                  ${availableSizes.map(size => `<option value="${size}">${size}</option>`).join("")}
                </select>
              </div>

              <div class="form-group">
                <label for="quantityInput">Cantidad</label>
                <input
                  id="quantityInput"
                  class="quantity-input"
                  type="number"
                  min="1"
                  value="1"
                />
              </div>
            </div>
          </div>

          <div class="product-detail-actions">
            <button class="big-btn primary" id="addProductBtn">Añadir al carrito</button>
            <a href="index.html" class="big-btn secondary">Seguir comprando</a>
          </div>
        </div>
      </article>
    `;

    document.getElementById("addProductBtn").addEventListener("click", () => {
      const selectedSize = document.getElementById("sizeSelect").value;
      const quantityValue = parseInt(document.getElementById("quantityInput").value, 10);

      if (!quantityValue || quantityValue < 1) {
        alert("Introduce una cantidad válida");
        return;
      }

      addToCart(product, selectedSize, quantityValue);
    });
  } catch (error) {
    productDetail.innerHTML = `<div class="no-results">No se pudo cargar el producto.</div>`;
    console.error(error);
  }
}

loadProduct();