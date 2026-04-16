const productDetail = document.getElementById("productDetail");

const PERSONALIZATION_EXTRA = 3;

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

    const sizes = product.sizes || ["S", "M", "L", "XL"];
    const gallery = product.gallery && product.gallery.length ? product.gallery : [product.image];

    let selectedSize = sizes[0];
    let quantity = 1;
    let currentImageIndex = 0;

    productDetail.innerHTML = `
      <article class="product-detail-card">
        <div class="product-gallery-area">
          <div class="main-image-carousel">
            <button class="carousel-arrow left" id="prevImageBtn" type="button" aria-label="Foto anterior">
              ‹
            </button>

            <div class="main-image-frame">
              <img src="${gallery[currentImageIndex]}" alt="${product.title}" class="product-detail-image zoomable-image" id="mainProductImage">
            </div>

            <button class="carousel-arrow right" id="nextImageBtn" type="button" aria-label="Foto siguiente">
              ›
            </button>
          </div>

          <div class="mini-gallery" id="miniGallery">
            ${gallery.map((img, index) => `
              <button class="mini-gallery-thumb ${index === 0 ? "active" : ""}" data-index="${index}" type="button">
                <img src="${img}" alt="${product.title} miniatura ${index + 1}">
              </button>
            `).join("")}
          </div>
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

          <div class="product-detail-price" id="productFinalPrice">${formatPrice(product.price)}</div>
          <p class="price-helper" id="priceHelper">Sin personalización añadida</p>

          <div class="product-option-block">
            <h4>Selecciona talla</h4>
            <div class="size-options" id="sizeOptions">
              ${sizes.map((size, index) => `
                <button class="size-btn ${index === 0 ? "active" : ""}" data-size="${size}" type="button">
                  ${size}
                </button>
              `).join("")}
            </div>
          </div>

          <div class="product-option-block">
            <h4>Selecciona cantidad</h4>
            <div class="quantity-selector">
              <button class="quantity-btn" id="decreaseQty" type="button">-</button>
              <span class="quantity-value" id="quantityValue">1</span>
              <button class="quantity-btn" id="increaseQty" type="button">+</button>
            </div>
          </div>

          <div class="product-option-block">
            <h4>Nombre personalizado</h4>
            <input
              type="text"
              id="customName"
              class="custom-input"
              maxlength="16"
              placeholder="Ej: JORDI"
            >
          </div>

          <div class="product-option-block">
            <h4>Número personalizado</h4>
            <input
              type="number"
              id="customNumber"
              class="custom-input"
              min="0"
              max="99"
              placeholder="Ej: 10"
            >
          </div>

          <div class="selected-info" id="selectedInfo">
            Talla seleccionada: <strong>${selectedSize}</strong> · Cantidad: <strong>${quantity}</strong>
          </div>

          <div class="product-detail-actions">
            <button class="big-btn primary" id="addProductBtn" type="button">Añadir al carrito</button>
            <a href="index.html" class="big-btn secondary">Seguir comprando</a>
          </div>
        </div>
      </article>
    `;

    const sizeButtons = document.querySelectorAll(".size-btn");
    const quantityValue = document.getElementById("quantityValue");
    const selectedInfo = document.getElementById("selectedInfo");
    const decreaseQtyBtn = document.getElementById("decreaseQty");
    const increaseQtyBtn = document.getElementById("increaseQty");
    const addProductBtn = document.getElementById("addProductBtn");
    const customNameInput = document.getElementById("customName");
    const customNumberInput = document.getElementById("customNumber");
    const mainProductImage = document.getElementById("mainProductImage");
    const galleryThumbs = document.querySelectorAll(".mini-gallery-thumb");
    const prevImageBtn = document.getElementById("prevImageBtn");
    const nextImageBtn = document.getElementById("nextImageBtn");
    const productFinalPrice = document.getElementById("productFinalPrice");
    const priceHelper = document.getElementById("priceHelper");

    function hasPersonalization() {
      const customName = customNameInput.value.trim();
      const customNumber = customNumberInput.value.trim();
      return customName !== "" || customNumber !== "";
    }

    function getUnitPrice() {
      return hasPersonalization() ? Number(product.price) + PERSONALIZATION_EXTRA : Number(product.price);
    }

    function updatePriceDisplay() {
      const unitPrice = getUnitPrice();
      productFinalPrice.textContent = formatPrice(unitPrice);

      if (hasPersonalization()) {
        priceHelper.textContent = `Incluye +${formatPrice(PERSONALIZATION_EXTRA)} por personalización`;
      } else {
        priceHelper.textContent = "Sin personalización añadida";
      }
    }

    function updateSelectedInfo() {
      selectedInfo.innerHTML = `Talla seleccionada: <strong>${selectedSize}</strong> · Cantidad: <strong>${quantity}</strong>`;
      quantityValue.textContent = quantity;
      updatePriceDisplay();
    }

    function updateMainImage(index) {
      currentImageIndex = index;
      mainProductImage.src = gallery[currentImageIndex];

      galleryThumbs.forEach(item => item.classList.remove("active"));
      const activeThumb = document.querySelector(`.mini-gallery-thumb[data-index="${index}"]`);
      if (activeThumb) activeThumb.classList.add("active");
    }

    sizeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        sizeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedSize = btn.dataset.size;
        updateSelectedInfo();
      });
    });

    decreaseQtyBtn.addEventListener("click", () => {
      if (quantity > 1) {
        quantity--;
        updateSelectedInfo();
      }
    });

    increaseQtyBtn.addEventListener("click", () => {
      quantity++;
      updateSelectedInfo();
    });

    galleryThumbs.forEach(btn => {
      btn.addEventListener("click", () => {
        updateMainImage(Number(btn.dataset.index));
      });
    });

    prevImageBtn.addEventListener("click", () => {
      const nextIndex = currentImageIndex === 0 ? gallery.length - 1 : currentImageIndex - 1;
      updateMainImage(nextIndex);
    });

    nextImageBtn.addEventListener("click", () => {
      const nextIndex = currentImageIndex === gallery.length - 1 ? 0 : currentImageIndex + 1;
      updateMainImage(nextIndex);
    });

    customNameInput.addEventListener("input", updatePriceDisplay);
    customNumberInput.addEventListener("input", updatePriceDisplay);

    addProductBtn.addEventListener("click", () => {
      let cart = JSON.parse(localStorage.getItem("golstyle_cart")) || [];

      const customName = customNameInput.value.trim().toUpperCase();
      const customNumber = customNumberInput.value.trim();
      const hasCustom = customName !== "" || customNumber !== "";
      const finalUnitPrice = hasCustom ? Number(product.price) + PERSONALIZATION_EXTRA : Number(product.price);

      const existing = cart.find(item =>
        item.id === product.id &&
        item.selectedSize === selectedSize &&
        (item.customName || "") === customName &&
        (item.customNumber || "") === customNumber
      );

      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({
          ...product,
          basePrice: Number(product.price),
          price: finalUnitPrice,
          quantity,
          selectedSize,
          customName,
          customNumber,
          personalizationExtra: hasCustom ? PERSONALIZATION_EXTRA : 0
        });
      }

      saveCart(cart);

      alert(
        `Producto añadido al carrito\nTalla: ${selectedSize}\nCantidad: ${quantity}` +
        `${customName ? `\nNombre: ${customName}` : ""}` +
        `${customNumber ? `\nNúmero: ${customNumber}` : ""}` +
        `${hasCustom ? `\nExtra personalización: +${formatPrice(PERSONALIZATION_EXTRA)}` : ""}`
      );
    });

    updateSelectedInfo();
    updateMainImage(0);
  } catch (error) {
    productDetail.innerHTML = `<div class="no-results">No se pudo cargar el producto.</div>`;
    console.error(error);
  }
}

loadProduct();