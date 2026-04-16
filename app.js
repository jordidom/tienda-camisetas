const productsGrid = document.getElementById("productsGrid");
const resultsText = document.getElementById("resultsText");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter-btn");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const whatsappOrderBtn = document.getElementById("whatsappOrderBtn");
const navCartCount = document.getElementById("navCartCount");
const cartItemsCountLabel = document.getElementById("cartItemsCountLabel");

const WHATSAPP_NUMBER = "34600000000";

let products = [];
let filteredProducts = [];
let currentFilter = { type: "all", value: "all" };
let cart = JSON.parse(localStorage.getItem("golstyle_cart")) || [];

function formatPrice(price) {
  return Number(price).toFixed(2).replace(".", ",") + " €";
}

async function loadProducts() {
  try {
    const res = await fetch("products.json");
    products = await res.json();
    filteredProducts = [...products];
    applyFilters();
    renderCart();
  } catch (error) {
    productsGrid.innerHTML = `<div class="no-results">No se pudieron cargar los productos.</div>`;
    console.error(error);
  }
}

function renderProducts(items) {
  resultsText.textContent = `${items.length} producto(s) encontrados`;

  if (!items.length) {
    productsGrid.innerHTML = `<div class="no-results">No hay camisetas que coincidan con los filtros.</div>`;
    return;
  }

  productsGrid.innerHTML = items.map(product => {
    const sizes = product.sizes || ["S", "M", "L", "XL"];
    const firstImage = product.gallery && product.gallery.length ? product.gallery[0] : product.image;

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img src="${firstImage}" alt="${product.title}" class="product-image">
          <span class="product-badge">${product.league}</span>
        </div>

        <div class="product-body">
          <div class="product-tags">
            <span class="product-tag">${product.team}</span>
            <span class="product-tag">${product.season}</span>
          </div>

          <h4 class="product-title">${product.title}</h4>
          <p class="product-desc">${product.description}</p>

          <div class="quick-size-block">
            <p class="quick-size-label">Talla:</p>
            <div class="card-size-options">
              ${sizes.map((size, index) => `
                <button
                  class="card-size-btn ${index === 0 ? "active" : ""}"
                  data-product-id="${product.id}"
                  data-size="${size}"
                  type="button"
                >
                  ${size}
                </button>
              `).join("")}
            </div>
          </div>

          <div class="product-bottom">
            <span class="product-price">${formatPrice(product.price)}</span>

            <div class="product-actions">
              <a class="details-btn" href="product.html?id=${product.id}">Ver ficha</a>
              <button class="add-btn" onclick="addToCartFromCard(${product.id})">Añadir</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");

  activateCardSizeSelectors();
}

function activateCardSizeSelectors() {
  const allSizeButtons = document.querySelectorAll(".card-size-btn");

  allSizeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = btn.dataset.productId;
      const group = document.querySelectorAll(`.card-size-btn[data-product-id="${productId}"]`);
      group.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function getSelectedCardSize(productId) {
  const activeBtn = document.querySelector(`.card-size-btn[data-product-id="${productId}"].active`);
  return activeBtn ? activeBtn.dataset.size : "M";
}

function applyFilters() {
  const search = searchInput.value.trim().toLowerCase();

  filteredProducts = products.filter(product => {
    const matchesSearch =
      product.title.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.team.toLowerCase().includes(search) ||
      product.league.toLowerCase().includes(search);

    let matchesFilter = true;

    if (currentFilter.type === "team") {
      matchesFilter = product.team === currentFilter.value;
    } else if (currentFilter.type === "league") {
      matchesFilter = product.league === currentFilter.value;
    }

    return matchesSearch && matchesFilter;
  });

  renderProducts(filteredProducts);
}

function saveCart() {
  localStorage.setItem("golstyle_cart", JSON.stringify(cart));
}

function addToCartFromCard(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const selectedSize = getSelectedCardSize(productId);

  const existing = cart.find(item =>
    item.id === productId &&
    item.selectedSize === selectedSize &&
    !item.customName &&
    !item.customNumber
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
      selectedSize,
      customName: "",
      customNumber: ""
    });
  }

  saveCart();
  renderCart();
}

function increaseQty(index) {
  if (!cart[index]) return;
  cart[index].quantity += 1;
  saveCart();
  renderCart();
}

function decreaseQty(index) {
  if (!cart[index]) return;

  cart[index].quantity -= 1;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function getCartCount() {
  return cart.reduce((acc, item) => acc + item.quantity, 0);
}

function createWhatsAppMessage(total) {
  const lines = cart.map(item => {
    let extra = ` | Talla: ${item.selectedSize || "-"}`;

    if (item.customName) {
      extra += ` | Nombre: ${item.customName}`;
    }

    if (item.customNumber) {
      extra += ` | Número: ${item.customNumber}`;
    }

    return `- ${item.title} | Cantidad: ${item.quantity}${extra} | Precio unidad: ${formatPrice(item.price)}`;
  });

  return `Hola, quiero hacer este pedido:\n\n${lines.join("\n")}\n\nTotal: ${formatPrice(total)}\n\nPago por Bizum.`;
}

function renderCart() {
  const count = getCartCount();
  navCartCount.textContent = count;
  cartItemsCountLabel.textContent = `${count} producto${count === 1 ? "" : "s"}`;

  if (!cart.length) {
    cartItemsContainer.innerHTML = `<p class="empty-state">Tu carrito está vacío.</p>`;
    cartTotal.textContent = "0,00 €";
    whatsappOrderBtn.href = "#";
    whatsappOrderBtn.classList.add("disabled");
    return;
  }

  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-top">
        <div>
          <p class="cart-item-name">${item.title}</p>
          <p class="cart-item-meta">
            ${formatPrice(item.price)} · ${item.team}
            ${item.selectedSize ? " · Talla: " + item.selectedSize : ""}
            ${item.customName ? " · Nombre: " + item.customName : ""}
            ${item.customNumber ? " · Nº: " + item.customNumber : ""}
            ${item.personalizationExtra ? " · Personalización: +" + formatPrice(item.personalizationExtra) : ""}
          </p>

          <div class="qty-controls">
            <button class="qty-btn" onclick="decreaseQty(${index})">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="increaseQty(${index})">+</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeFromCart(${index})">Quitar</button>
      </div>
    </div>
  `).join("");

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  cartTotal.textContent = formatPrice(total);

  whatsappOrderBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(createWhatsAppMessage(total))}`;
  whatsappOrderBtn.classList.remove("disabled");
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    currentFilter = {
      type: button.dataset.type,
      value: button.dataset.value
    };

    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);

loadProducts();