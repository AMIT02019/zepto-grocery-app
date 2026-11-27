// Zepto Clone Interactive Core Logic with SPA Router
(function () {
  'use strict';

  // --- State Management ---
  const state = {
    cart: JSON.parse(localStorage.getItem('zepto_cart') || '{}'),
    location: localStorage.getItem('zepto_location') || 'Mumbai 400001, Maharashtra',
    user: JSON.parse(localStorage.getItem('zepto_user') || 'null'),
    products: []
  };

  function saveCart() {
    localStorage.setItem('zepto_cart', JSON.stringify(state.cart));
    updateCartUI();
  }

  function getCartCount() {
    return Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0);
  }

  function getCartTotal() {
    return Object.values(state.cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function showToast(msg) {
    const existing = document.querySelector('.zepto-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'zepto-toast';
    toast.innerHTML = `<span>✓</span><span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // --- Extract Products from Page JSON-LD ---
  function initProducts() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(s => {
      try {
        const data = JSON.parse(s.textContent);
        if (data['@type'] === 'ItemList' && Array.isArray(data.itemListElement)) {
          data.itemListElement.forEach(el => {
            if (el.item && el.item['@type'] === 'Product') {
              const p = el.item;
              const id = p.url || p.name;
              state.products.push({
                id: id,
                name: p.name,
                brand: p.brand ? p.brand.name : 'Zepto',
                price: parseFloat(p.offers ? p.offers.price : '0') || 99,
                image: p.image || '',
                rating: p.aggregateRating ? p.aggregateRating.ratingValue : 4.5,
                reviews: p.aggregateRating ? p.aggregateRating.reviewCount : 120,
                desc: p.description || p.name,
                url: p.url || '#'
              });
            }
          });
        }
      } catch (e) {}
    });
  }

  // --- Cart Drawer UI ---
  function openCartDrawer() {
    const existing = document.getElementById('zeptoCartOverlay');
    if (existing) existing.remove();

    const drawerOverlay = document.createElement('div');
    drawerOverlay.className = 'zepto-drawer-overlay';
    drawerOverlay.id = 'zeptoCartOverlay';

    const count = getCartCount();
    const total = getCartTotal();
    const items = Object.values(state.cart);

    drawerOverlay.innerHTML = `
      <div class="zepto-drawer">
        <div style="padding: 1.25rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 700; color: #111827; margin: 0;">Your Cart</h2>
            <p style="font-size: 0.85rem; color: #6b7280; margin: 2px 0 0 0;">${count} ${count === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          <button id="closeCartBtn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 4px;">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 1.25rem;">
          ${items.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
              <h3 style="font-size: 1.1rem; font-weight: 600; color: #374151;">Your cart is empty</h3>
              <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem;">Explore categories and add your favorite groceries in minutes!</p>
              <button id="cartShopNow" style="margin-top: 1.5rem; background: #ff3269; color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Shop Now</button>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${items.map(it => `
                <div style="display: flex; align-items: center; gap: 0.75rem; padding-bottom: 1rem; border-bottom: 1px solid #f3f4f6;">
                  <img src="${it.image}" alt="${it.name}" style="width: 56px; height: 56px; object-fit: contain; border-radius: 0.375rem; border: 1px solid #e5e7eb; background: #f9fafb;" />
                  <div style="flex: 1; min-width: 0;">
                    <h4 style="font-size: 0.875rem; font-weight: 600; color: #1f2937; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${it.name}</h4>
                    <p style="font-size: 0.8rem; color: #4b5563; margin: 4px 0 0 0; font-weight: 700;">₹${it.price}</p>
                  </div>
                  <div class="qty-stepper" data-prod-id="${it.id}">
                    <button class="cart-minus" data-id="${it.id}">−</button>
                    <span>${it.quantity}</span>
                    <button class="cart-plus" data-id="${it.id}">+</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 1.5rem; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
              <h4 style="font-size: 0.9rem; font-weight: 700; color: #111827; margin: 0 0 0.75rem 0;">Bill Details</h4>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">
                <span>Subtotal</span>
                <span>₹${total}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #4b5563; margin-bottom: 0.35rem;">
                <span>Delivery Fee (10 Mins)</span>
                <span style="color: #10b981; font-weight: 600;">FREE</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #4b5563; margin-bottom: 0.5rem;">
                <span>Handling Charge</span>
                <span>₹4</span>
              </div>
              <div style="border-top: 1px dashed #d1d5db; padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; color: #111827;">
                <span>To Pay</span>
                <span>₹${total + (items.length > 0 ? 4 : 0)}</span>
              </div>
            </div>
          `}
        </div>

        ${items.length > 0 ? `
          <div style="padding: 1.25rem; border-top: 1px solid #e5e7eb; background: #ffffff;">
            <button id="checkoutBtn" style="width: 100%; background: #ff3269; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(255, 50, 105, 0.4);">
              <span>₹${total + 4} • Proceed to Checkout</span>
              <span>→</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(drawerOverlay);

    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay || e.target.id === 'closeCartBtn' || e.target.id === 'cartShopNow') {
        drawerOverlay.remove();
      }
    });

    drawerOverlay.querySelectorAll('.cart-plus').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        if (state.cart[id]) {
          state.cart[id].quantity += 1;
          saveCart();
          openCartDrawer();
        }
      });
    });

    drawerOverlay.querySelectorAll('.cart-minus').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        if (state.cart[id]) {
          state.cart[id].quantity -= 1;
          if (state.cart[id].quantity <= 0) {
            delete state.cart[id];
          }
          saveCart();
          openCartDrawer();
        }
      });
    });

    const checkoutBtn = drawerOverlay.querySelector('#checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        drawerOverlay.remove();
        openCheckoutModal();
      });
    }
  }

  // --- Product Quick View Modal ---
  function openProductModal(prod) {
    const existing = document.getElementById('productQuickViewModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'zepto-modal-overlay';
    modal.id = 'productQuickViewModal';

    const cartItem = state.cart[prod.id];
    const qty = cartItem ? cartItem.quantity : 0;

    modal.innerHTML = `
      <div class="zepto-modal-card">
        <div style="padding: 1.25rem; display: flex; justify-content: flex-end;">
          <button id="closeProdModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 4px;">✕</button>
        </div>
        <div style="padding: 0 1.5rem 1.5rem 1.5rem; text-align: center;">
          <img src="${prod.image}" alt="${prod.name}" style="max-height: 220px; max-width: 100%; object-fit: contain; margin: 0 auto; display: block;" />
          <div style="margin-top: 1.25rem; text-align: left;">
            <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #9ca3af; letter-spacing: 0.05em;">${prod.brand}</span>
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #111827; margin: 4px 0 8px 0;">${prod.name}</h2>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="background: #ecfdf5; color: #059669; font-weight: 700; font-size: 0.8rem; padding: 2px 8px; border-radius: 4px;">★ ${prod.rating}</span>
              <span style="font-size: 0.8rem; color: #6b7280;">(${prod.reviews} verified reviews)</span>
            </div>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px;">
              <span style="font-size: 1.5rem; font-weight: 800; color: #111827;">₹${prod.price}</span>
              <span style="font-size: 0.85rem; color: #10b981; font-weight: 600;">Standard Zepto Instant Delivery (10 Mins)</span>
            </div>
            <p style="font-size: 0.9rem; color: #4b5563; line-height: 1.5; margin-bottom: 1.5rem;">${prod.desc}</p>
            
            <div style="display: flex; gap: 12px;">
              ${qty > 0 ? `
                <div class="qty-stepper" style="flex: 1; justify-content: center; gap: 24px; padding: 0.75rem;">
                  <button id="modalMinus" style="font-size: 1.4rem;">−</button>
                  <span style="font-size: 1.1rem;">${qty} in Cart</span>
                  <button id="modalPlus" style="font-size: 1.4rem;">+</button>
                </div>
              ` : `
                <button id="modalAddBtn" style="flex: 1; background: #ff3269; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(255, 50, 105, 0.4);">
                  Add to Cart • ₹${prod.price}
                </button>
              `}
              <button id="modalViewCartBtn" style="background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; padding: 0.85rem 1.25rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">
                View Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'closeProdModal') {
        modal.remove();
        if (window.location.pathname.includes('/pn/')) {
          history.pushState(null, '', '/');
        }
      }
    });

    const addBtn = modal.querySelector('#modalAddBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        state.cart[prod.id] = { ...prod, quantity: 1 };
        saveCart();
        showToast(`Added ${prod.name} to cart`);
        openProductModal(prod);
      });
    }

    const modalPlus = modal.querySelector('#modalPlus');
    if (modalPlus) {
      modalPlus.addEventListener('click', () => {
        state.cart[prod.id].quantity += 1;
        saveCart();
        openProductModal(prod);
      });
    }

    const modalMinus = modal.querySelector('#modalMinus');
    if (modalMinus) {
      modalMinus.addEventListener('click', () => {
        state.cart[prod.id].quantity -= 1;
        if (state.cart[prod.id].quantity <= 0) {
          delete state.cart[prod.id];
        }
        saveCart();
        openProductModal(prod);
      });
    }

    const viewCartBtn = modal.querySelector('#modalViewCartBtn');
    if (viewCartBtn) {
      viewCartBtn.addEventListener('click', () => {
        modal.remove();
        openCartDrawer();
      });
    }
  }

  // --- Category Showcase View ---
  function showCategoryView(catTitle, filterKeywords) {
    const existing = document.getElementById('zeptoCatModal');
    if (existing) existing.remove();

    const matchedProducts = state.products.filter(p => {
      const text = (p.name + ' ' + p.brand + ' ' + p.desc).toLowerCase();
      return filterKeywords.some(kw => text.includes(kw.toLowerCase()));
    });

    const displayProducts = matchedProducts.length > 0 ? matchedProducts : state.products.slice(0, 12);

    const modal = document.createElement('div');
    modal.className = 'zepto-modal-overlay';
    modal.id = 'zeptoCatModal';

    modal.innerHTML = `
      <div class="zepto-modal-card" style="max-width: 860px; width: 95%; max-height: 90vh;">
        <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white; z-index: 10;">
          <div>
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827;">${catTitle}</h2>
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #6b7280;">Showing ${displayProducts.length} instant-delivery products</p>
          </div>
          <button id="closeCatModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 4px;">✕</button>
        </div>
        <div style="padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
          ${displayProducts.map(p => `
            <div class="cat-prod-card" data-prod-id="${p.id}" style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.85rem; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; background: white; transition: box-shadow 0.2s;">
              <div style="text-align: center; margin-bottom: 0.75rem;">
                <img src="${p.image}" alt="${p.name}" style="height: 110px; width: 100%; object-fit: contain;" />
              </div>
              <div>
                <p style="margin: 0 0 4px 0; font-size: 0.75rem; text-transform: uppercase; color: #9ca3af; font-weight: 700;">${p.brand}</p>
                <h4 style="margin: 0 0 8px 0; font-size: 0.85rem; font-weight: 600; color: #1f2937; line-height: 1.3; height: 34px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${p.name}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                  <span style="font-weight: 800; font-size: 1rem; color: #111827;">₹${p.price}</span>
                  <button class="cat-quick-add" data-prod-id="${p.id}" style="background: #ff3269; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">ADD</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'closeCatModal') {
        modal.remove();
        if (window.location.pathname.includes('/cn/') || window.location.pathname.includes('/category/')) {
          history.pushState(null, '', '/');
        }
      }
    });

    modal.querySelectorAll('.cat-prod-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('cat-quick-add')) return;
        const pid = card.dataset.prodId;
        const prod = state.products.find(x => x.id === pid);
        if (prod) openProductModal(prod);
      });
    });

    modal.querySelectorAll('.cat-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btn.dataset.prodId;
        const prod = state.products.find(x => x.id === pid);
        if (prod) {
          state.cart[prod.id] = state.cart[prod.id] ? { ...prod, quantity: state.cart[prod.id].quantity + 1 } : { ...prod, quantity: 1 };
          saveCart();
          showToast(`Added ${prod.name}`);
        }
      });
    });
  }

  // --- SPA Route Handler ---
  function handleRoute() {
    const path = window.location.pathname;
    if (path.includes('/search')) {
      openSearchModal();
    } else if (path.includes('/pn/')) {
      const prod = state.products.find(p => p.url && (p.url.includes(path) || path.includes(p.url))) || state.products[0];
      if (prod) openProductModal(prod);
    } else if (path.includes('/cn/') || path.includes('/category/')) {
      const parts = path.split('/').filter(Boolean);
      const catSlug = parts[1] || parts[0] || 'Groceries';
      const catTitle = catSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
      const keywords = catSlug.split('-');
      showCategoryView(catTitle, keywords);
    }
  }

  // --- Search Overlay / Live Search ---
  function openSearchModal() {
    const existing = document.getElementById('zeptoSearchModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'zepto-modal-overlay';
    modal.id = 'zeptoSearchModal';

    modal.innerHTML = `
      <div class="zepto-modal-card" style="max-width: 640px; margin-top: 2rem; align-self: flex-start;">
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.2rem; color: #9ca3af;">🔍</span>
          <input id="zeptoLiveSearchInput" type="text" placeholder="Search for groceries, veggies, dairy, snacks..." style="flex: 1; border: none; outline: none; font-size: 1.05rem; color: #111827;" autofocus />
          <button id="closeSearchModal" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6b7280; padding: 4px;">✕</button>
        </div>
        <div id="zeptoSearchResults" style="max-height: 60vh; overflow-y: auto; padding: 1rem 1.25rem;">
          <p style="font-size: 0.85rem; color: #6b7280; margin: 0 0 0.75rem 0; font-weight: 600;">POPULAR SUGGESTIONS</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.25rem;">
            ${['Milk', 'Detergent', 'Butter', 'Atta', 'Eggs', 'Tea', 'Potato', 'Paneer'].map(t => `
              <span class="search-tag" style="background: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; cursor: pointer;">${t}</span>
            `).join('')}
          </div>
          <div id="searchResultsList" style="display: flex; flex-direction: column; gap: 0.75rem;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const input = modal.querySelector('#zeptoLiveSearchInput');
    const resultsContainer = modal.querySelector('#searchResultsList');
    input.focus();

    function renderResults(q) {
      if (!q.trim()) {
        resultsContainer.innerHTML = '';
        return;
      }
      const match = state.products.filter(p => 
        p.name.toLowerCase().includes(q.toLowerCase()) || 
        p.brand.toLowerCase().includes(q.toLowerCase())
      );
      if (match.length === 0) {
        resultsContainer.innerHTML = `<p style="color: #9ca3af; text-align: center; padding: 1.5rem;">No products found for "${q}"</p>`;
        return;
      }
      resultsContainer.innerHTML = match.slice(0, 10).map(p => `
        <div class="search-result-row" data-prod-id="${p.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 8px; border-radius: 8px; cursor: pointer; hover: background: #f9fafb;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${p.image}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: contain; border-radius: 4px; border: 1px solid #e5e7eb;" />
            <div>
              <p style="margin: 0; font-size: 0.9rem; font-weight: 600; color: #1f2937;">${p.name}</p>
              <p style="margin: 0; font-size: 0.8rem; color: #4b5563;">₹${p.price} • ${p.brand}</p>
            </div>
          </div>
          <button class="search-quick-add" data-prod-id="${p.id}" style="background: #ff3269; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 0.8rem; cursor: pointer;">ADD</button>
        </div>
      `).join('');

      resultsContainer.querySelectorAll('.search-result-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.classList.contains('search-quick-add')) return;
          const pid = row.dataset.prodId;
          const p = state.products.find(x => x.id === pid);
          if (p) {
            modal.remove();
            openProductModal(p);
          }
        });
      });

      resultsContainer.querySelectorAll('.search-quick-add').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const pid = btn.dataset.prodId;
          const p = state.products.find(x => x.id === pid);
          if (p) {
            state.cart[p.id] = state.cart[p.id] ? { ...p, quantity: state.cart[p.id].quantity + 1 } : { ...p, quantity: 1 };
            saveCart();
            showToast(`Added ${p.name}`);
          }
        });
      });
    }

    input.addEventListener('input', (e) => renderResults(e.target.value));

    modal.querySelectorAll('.search-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        input.value = tag.textContent;
        renderResults(tag.textContent);
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'closeSearchModal') {
        modal.remove();
        if (window.location.pathname.includes('/search')) {
          history.pushState(null, '', '/');
        }
      }
    });
  }

  // --- Location Selector Modal ---
  function openLocationModal() {
    const existing = document.getElementById('zeptoLocationModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'zepto-modal-overlay';
    modal.id = 'zeptoLocationModal';

    const cities = ['Mumbai 400001, Maharashtra', 'Bengaluru 560001, Karnataka', 'Delhi NCR 110001, Delhi', 'Hyderabad 500001, Telangana', 'Pune 411001, Maharashtra', 'Chennai 600001, Tamil Nadu', 'Kolkata 700001, West Bengal', 'Ahmedabad 380001, Gujarat'];

    modal.innerHTML = `
      <div class="zepto-modal-card">
        <div style="padding: 1.25rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827;">Select Delivery Location</h3>
          <button id="closeLocModal" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        <div style="padding: 1.25rem;">
          <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
            <input id="customLocInput" type="text" placeholder="Enter Pincode or City..." value="${state.location}" style="flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.9rem;" />
            <button id="saveCustomLocBtn" style="background: #ff3269; color: white; border: none; padding: 0 1rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer;">Save</button>
          </div>
          <p style="font-size: 0.8rem; font-weight: 600; color: #6b7280; margin: 0 0 0.5rem 0;">POPULAR DELIVERY CITIES (10-MIN ACTIVE)</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${cities.map(c => `
              <div class="city-option" data-loc="${c}" style="padding: 0.65rem 0.75rem; border-radius: 0.375rem; border: 1px solid #e5e7eb; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #374151; display: flex; justify-content: space-between; align-items: center;">
                <span>📍 ${c}</span>
                ${state.location === c ? '<span style="color: #10b981; font-weight: 700;">✓ Active</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'closeLocModal') modal.remove();
    });

    const setLoc = (loc) => {
      state.location = loc;
      localStorage.setItem('zepto_location', loc);
      updateLocationUI();
      showToast(`Delivering to ${loc.split(',')[0]}`);
      modal.remove();
    };

    modal.querySelectorAll('.city-option').forEach(opt => {
      opt.addEventListener('click', () => setLoc(opt.dataset.loc));
    });

    modal.querySelector('#saveCustomLocBtn').addEventListener('click', () => {
      const val = modal.querySelector('#customLocInput').value.trim();
      if (val) setLoc(val);
    });
  }

  // --- Auth / Login Modal ---
  function openLoginModal() {
    const existing = document.getElementById('zeptoLoginModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'zepto-modal-overlay';
    modal.id = 'zeptoLoginModal';

    modal.innerHTML = `
      <div class="zepto-modal-card" style="max-width: 400px; text-align: center;">
        <div style="padding: 1.25rem; display: flex; justify-content: flex-end;">
          <button id="closeLoginModal" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        <div style="padding: 0 1.5rem 2rem 1.5rem;">
          <div style="width: 56px; height: 56px; background: #ffe4e9; color: #ff3269; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin: 0 auto 1rem auto;">⚡</div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0;">Groceries in 10 Minutes</h2>
          <p style="font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0;">Log in or Sign up to access saved addresses and track live orders</p>
          
          <div style="display: flex; border: 1px solid #d1d5db; border-radius: 0.5rem; overflow: hidden; margin-bottom: 1rem;">
            <span style="background: #f9fafb; padding: 0.75rem 0.85rem; font-weight: 600; font-size: 0.95rem; color: #374151; border-right: 1px solid #d1d5db;">+91</span>
            <input id="loginPhoneInput" type="tel" maxlength="10" placeholder="Enter Phone Number" style="flex: 1; border: none; outline: none; padding: 0.75rem; font-size: 0.95rem;" />
          </div>

          <button id="sendOtpBtn" style="width: 100%; background: #ff3269; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(255, 50, 105, 0.4);">
            Continue with Phone
          </button>
          
          <p style="font-size: 0.75rem; color: #9ca3af; margin: 1rem 0 0 0;">By continuing, you agree to Zepto's Terms of Service & Privacy Policy</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'closeLoginModal') modal.remove();
    });

    modal.querySelector('#sendOtpBtn').addEventListener('click', () => {
      const phone = modal.querySelector('#loginPhoneInput').value.trim();
      if (phone.length === 10) {
        state.user = { phone: phone, name: 'Zepto User' };
        localStorage.setItem('zepto_user', JSON.stringify(state.user));
        updateUserUI();
        showToast(`Logged in successfully with +91 ${phone}`);
        modal.remove();
      } else {
        alert('Please enter a valid 10-digit mobile number');
      }
    });
  }

  // --- Checkout Modal ---
  function openCheckoutModal() {
    const existing = document.getElementById('zeptoCheckoutModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'zepto-modal-overlay';
    modal.id = 'zeptoCheckoutModal';

    const total = getCartTotal() + 4;

    modal.innerHTML = `
      <div class="zepto-modal-card" style="max-width: 480px;">
        <div style="padding: 1.25rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827;">Confirm & Place Order</h3>
          <button id="closeCheckoutModal" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        <div style="padding: 1.25rem;">
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">⚡</span>
            <div>
              <p style="margin: 0; font-size: 0.85rem; font-weight: 700; color: #065f46;">Delivering in 10 Mins</p>
              <p style="margin: 0; font-size: 0.8rem; color: #047857;">To: ${state.location}</p>
            </div>
          </div>

          <p style="font-size: 0.85rem; font-weight: 700; color: #374151; margin: 0 0 0.5rem 0;">CHOOSE PAYMENT METHOD</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
            <label style="display: flex; align-items: center; gap: 8px; padding: 0.65rem; border: 1px solid #d1d5db; border-radius: 0.375rem; cursor: pointer;">
              <input type="radio" name="paymethod" value="upi" checked />
              <span style="font-size: 0.9rem; font-weight: 600;">Google Pay / PhonePe / UPI</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; padding: 0.65rem; border: 1px solid #d1d5db; border-radius: 0.375rem; cursor: pointer;">
              <input type="radio" name="paymethod" value="cod" />
              <span style="font-size: 0.9rem; font-weight: 600;">Cash on Delivery (COD)</span>
            </label>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; color: #111827;">
              <span>Total Payable</span>
              <span>₹${total}</span>
            </div>
          </div>

          <button id="placeOrderFinalBtn" style="width: 100%; background: #10b981; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer;">
            Place Order • ₹${total}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'closeCheckoutModal') modal.remove();
    });

    modal.querySelector('#placeOrderFinalBtn').addEventListener('click', () => {
      modal.remove();
      state.cart = {};
      saveCart();
      
      const successModal = document.createElement('div');
      successModal.className = 'zepto-modal-overlay';
      successModal.innerHTML = `
        <div class="zepto-modal-card" style="text-align: center; padding: 2.5rem 1.5rem;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🎉</div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #111827; margin: 0 0 0.5rem 0;">Order Placed Successfully!</h2>
          <p style="font-size: 0.95rem; color: #4b5563; margin: 0 0 1.5rem 0;">Your delivery partner is packing your items. Expected arrival in <strong>10 minutes</strong> at ${state.location.split(',')[0]}.</p>
          <button id="successOkBtn" style="background: #ff3269; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">Awesome, Thanks!</button>
        </div>
      `;
      document.body.appendChild(successModal);
      successModal.querySelector('#successOkBtn').addEventListener('click', () => successModal.remove());
    });
  }

  // --- UI Synchronizers ---
  function updateCartUI() {
    const count = getCartCount();
    const cartBtn = document.querySelector('button:has(span:-soup-contains("Cart"))') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Cart'));
    
    if (cartBtn) {
      let badge = cartBtn.querySelector('.cart-count-badge');
      if (!badge && count > 0) {
        badge = document.createElement('span');
        badge.className = 'cart-count-badge';
        cartBtn.style.position = 'relative';
        cartBtn.appendChild(badge);
      }
      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    }
  }

  function updateLocationUI() {
    const locBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Select Location') || b.textContent.includes('Mumbai') || b.textContent.includes('Maharashtra'));
    if (locBtn) {
      const heading = locBtn.querySelector('h3') || locBtn;
      if (heading) {
        heading.textContent = state.location.split(',')[0];
      }
    }
  }

  function updateUserUI() {
    const loginBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'login' || b.textContent.includes('User'));
    if (loginBtn && state.user) {
      loginBtn.innerHTML = `<span>👤 ${state.user.phone.slice(-4)}</span>`;
    }
  }

  // --- Attach Event Listeners to Static Page Elements ---
  function attachPageListeners() {
    // 1. Cart button
    const allButtons = Array.from(document.querySelectorAll('button'));
    const cartBtn = allButtons.find(b => b.textContent.includes('Cart'));
    if (cartBtn) {
      cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    }

    // 2. Search bar trigger
    const searchAnchor = document.querySelector('a[href="/search"]') ||
                         Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Search for'));
    if (searchAnchor) {
      searchAnchor.addEventListener('click', (e) => {
        e.preventDefault();
        history.pushState(null, '', '/search');
        openSearchModal();
      });
    }

    // 3. Location trigger
    const locBtn = allButtons.find(b => b.textContent.includes('Select Location'));
    if (locBtn) {
      locBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openLocationModal();
      });
    }

    // 4. Login button trigger
    const loginBtn = allButtons.find(b => b.textContent.trim().toLowerCase() === 'login');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
      });
    }

    // 5. Product "ADD" buttons
    allButtons.forEach(b => {
      if (b.textContent.trim().toUpperCase() === 'ADD') {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const card = b.closest('a') || b.closest('div');
          const href = card && card.getAttribute ? card.getAttribute('href') : '';
          
          let prod = null;
          if (href) {
            prod = state.products.find(p => p.url && (p.url.includes(href) || href.includes(p.url)));
          }
          if (!prod) {
            const text = card ? card.textContent : '';
            prod = state.products.find(p => text.includes(p.name));
          }
          if (!prod) {
            prod = {
              id: href || 'prod-' + Math.random(),
              name: 'Zepto Grocery Item',
              brand: 'Zepto',
              price: 199,
              image: '/assets/images/img-001.svg',
              rating: 4.8,
              reviews: 520,
              desc: 'Freshly packed grocery product delivered in 10 minutes.'
            };
          }

          state.cart[prod.id] = state.cart[prod.id] ? { ...prod, quantity: state.cart[prod.id].quantity + 1 } : { ...prod, quantity: 1 };
          saveCart();
          showToast(`Added ${prod.name.slice(0, 24)}... to cart!`);
        });
      }
    });

    // 6. Click on product card to open Quick View Modal with URL pushState
    document.querySelectorAll('a[href*="/pn/"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        const href = a.getAttribute('href');
        const prod = state.products.find(p => p.url && p.url.includes(href));
        if (prod) {
          history.pushState(null, '', href);
          openProductModal(prod);
        }
      });
    });

    // 7. Category links filter or preview with URL pushState
    document.querySelectorAll('a[href*="/cn/"], a[href*="/category/"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const href = a.getAttribute('href');
        const catName = a.textContent.trim();
        history.pushState(null, '', href);
        handleRoute();
      });
    });

    window.addEventListener('popstate', () => {
      handleRoute();
    });
  }

  // --- Initialize Everything ---
  window.addEventListener('DOMContentLoaded', () => {
    initProducts();
    updateLocationUI();
    updateUserUI();
    updateCartUI();
    attachPageListeners();
    handleRoute();
  });

})();
