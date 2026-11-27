// Zepto Clone Full SPA Router & Interactive Engine
(function () {
  'use strict';

  const state = {
    cart: JSON.parse(localStorage.getItem('zepto_cart') || '{}'),
    location: localStorage.getItem('zepto_location') || 'Mumbai 400001, Maharashtra',
    user: JSON.parse(localStorage.getItem('zepto_user') || 'null'),
    products: [],
    categories: [],
    sections: [],
    homeContainer: null,
    spaContainer: null,
    activeSort: 'relevance'
  };

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function saveCart() {
    localStorage.setItem('zepto_cart', JSON.stringify(state.cart));
    updateCartUI();
  }

  function getCartCount() {
    return Object.values(state.cart).reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  function getCartTotal() {
    return Object.values(state.cart).reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
  }

  function showToast(msg) {
    const existing = document.querySelector('.zepto-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'zepto-toast';
    toast.innerHTML = `<span>✓</span><span>${esc(msg)}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2400);
  }

  function findProductByUrl(url) {
    if (!url) return null;
    const clean = url.replace(/^https?:\/\/[^/]+/, '');
    return state.products.find(p => p.url === clean || clean.includes(p.url) || p.url.includes(clean));
  }

  function addToCart(prod, delta) {
    if (!prod) return;
    const id = prod.url || prod.id || prod.name;
    const cur = state.cart[id] ? state.cart[id].quantity : 0;
    const next = cur + delta;
    if (next <= 0) {
      delete state.cart[id];
    } else {
      state.cart[id] = {
        id: id,
        url: prod.url || id,
        name: prod.name,
        brand: prod.brand || 'Zepto',
        price: Number(prod.price) || 99,
        mrp: Number(prod.mrp) || Number(prod.price) || 99,
        weight: prod.weight || '1 pack',
        image: prod.image || '/assets/images/img-001.svg',
        quantity: next
      };
    }
    saveCart();
  }

  // --- Load Catalog from /catalog.json (with DOM fallback) ---
  async function loadCatalog() {
    try {
      const res = await fetch('/catalog.json');
      if (res.ok) {
        const data = await res.json();
        state.products = data.products || [];
        state.categories = data.categories || [];
      }
    } catch (e) {}

    if (state.products.length === 0) {
      // Fallback: parse DOM product links
      document.querySelectorAll('a[href*="/pn/"]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || state.products.some(p => p.url === href)) return;
        const img = a.querySelector('img');
        const texts = Array.from(a.querySelectorAll('*'))
          .filter(el => el.children.length === 0 && el.textContent.trim())
          .map(el => el.textContent.trim())
          .filter(t => t !== 'ADD');
        const prices = texts.filter(t => t.includes('₹')).map(t => parseInt(t.replace(/[^\d]/g, ''), 10)).filter(Boolean);
        const nonPrices = texts.filter(t => !t.includes('₹') && !t.includes('% OFF'));
        state.products.push({
          url: href,
          name: nonPrices[0] || 'Zepto Grocery Item',
          brand: (nonPrices[0] || 'Zepto').split(' ')[0],
          price: prices[0] || 99,
          mrp: prices[1] || prices[0] || 99,
          weight: nonPrices[1] || '1 pack',
          image: img ? img.getAttribute('src') : '/assets/images/img-001.svg',
          rating: 4.6,
          reviews: 320,
          desc: `Buy ${nonPrices[0] || 'this item'} on Zepto with 10-minute instant delivery.`,
          section: 'Featured Products'
        });
      });
    }

    const secSet = new Set();
    state.products.forEach(p => { if (p.section) secSet.add(p.section); });
    state.sections = Array.from(secSet);
  }

  // --- Mount Containers ---
  function ensureContainers() {
    const shell = document.querySelector('.min-h-screen');
    const footer = document.querySelector('footer');
    const menuBar = document.querySelector('.__6E3Wm');
    if (menuBar && menuBar.nextElementSibling && menuBar.nextElementSibling !== footer) {
      state.homeContainer = menuBar.nextElementSibling;
    } else if (shell) {
      state.homeContainer = Array.from(shell.children).find(
        el => el.tagName === 'DIV' && !el.classList.contains('__6E3Wm') && el.id !== 'zepto-spa-view'
      );
    }

    let spa = document.getElementById('zepto-spa-view');
    if (!spa && shell && footer) {
      spa = document.createElement('div');
      spa.id = 'zepto-spa-view';
      spa.style.display = 'none';
      shell.insertBefore(spa, footer);
    }
    state.spaContainer = spa;
  }

  function showHomeView() {
    if (state.homeContainer) state.homeContainer.style.display = '';
    if (state.spaContainer) {
      state.spaContainer.style.display = 'none';
      state.spaContainer.innerHTML = '';
    }
    setActiveMenuTab('All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showSpaView(html) {
    if (state.homeContainer) state.homeContainer.style.display = 'none';
    if (state.spaContainer) {
      state.spaContainer.style.display = 'block';
      state.spaContainer.innerHTML = html;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setActiveMenuTab(label) {
    document.querySelectorAll('.__8pvtm').forEach(btn => {
      const txt = btn.textContent.trim().toLowerCase();
      if (txt === label.toLowerCase()) {
        btn.classList.add('zp-tab-active');
      } else {
        btn.classList.remove('zp-tab-active');
      }
    });
  }

  // --- Product Card Component ---
  function renderProductCard(p) {
    const inCart = state.cart[p.url];
    const qty = inCart ? inCart.quantity : 0;
    const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

    return `
      <div class="zp-card" data-prod-url="${esc(p.url)}">
        <div>
          <div class="zp-card-img-wrap">
            ${discount > 0 ? `<span class="zp-discount-badge">${discount}% OFF</span>` : ''}
            <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />
          </div>
          <div class="zp-eta-badge">⚡ 10 MINS</div>
          <h4 style="margin: 0 0 4px 0; font-size: 0.85rem; font-weight: 600; color: #1f2937; line-height: 1.3; height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${esc(p.name)}</h4>
          <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #6b7280;">${esc(p.weight)}</p>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 6px;">
          <div>
            <span style="font-weight: 800; font-size: 0.95rem; color: #111827;">₹${p.price}</span>
            ${p.mrp > p.price ? `<span style="font-size: 0.75rem; color: #9ca3af; text-decoration: line-through; margin-left: 4px;">₹${p.mrp}</span>` : ''}
          </div>
          ${qty > 0 ? `
            <div class="qty-stepper" data-stepper-url="${esc(p.url)}">
              <button type="button" class="zp-qty-dec" data-url="${esc(p.url)}">−</button>
              <span>${qty}</span>
              <button type="button" class="zp-qty-inc" data-url="${esc(p.url)}">+</button>
            </div>
          ` : `
            <button type="button" class="zp-add-btn" data-add-url="${esc(p.url)}">ADD</button>
          `}
        </div>
      </div>
    `;
  }

  // --- Full Single Product Page (PDP) ---
  function renderProductPage(prod) {
    if (!prod) return showHomeView();
    const inCart = state.cart[prod.url];
    const qty = inCart ? inCart.quantity : 0;
    const discount = prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0;

    // Similar products from same section or fallback
    let similar = state.products.filter(p => p.url !== prod.url && p.section === prod.section);
    if (similar.length < 5) {
      const extras = state.products.filter(p => p.url !== prod.url && p.section !== prod.section);
      similar = similar.concat(extras).slice(0, 10);
    } else {
      similar = similar.slice(0, 10);
    }

    const html = `
      <nav class="zp-breadcrumb">
        <a href="/" data-spa-nav="/">Home</a>
        <span>›</span>
        <a href="/category/${encodeURIComponent(prod.section.toLowerCase().replace(/\s+/g, '-'))}" data-spa-nav="/category/${encodeURIComponent(prod.section.toLowerCase().replace(/\s+/g, '-'))}">${esc(prod.section)}</a>
        <span>›</span>
        <span style="color: #111827; font-weight: 600;">${esc(prod.name)}</span>
      </nav>

      <div class="zp-pdp-grid">
        <div>
          <div class="zp-pdp-img-box">
            <img src="${esc(prod.image)}" alt="${esc(prod.name)}" />
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 1rem;">
            <div style="background: #f9fafb; border: 1px solid #ece9f2; border-radius: 0.5rem; padding: 0.65rem; text-align: center; font-size: 0.75rem; color: #374151; font-weight: 600;">⚡ 10 Min Delivery</div>
            <div style="background: #f9fafb; border: 1px solid #ece9f2; border-radius: 0.5rem; padding: 0.65rem; text-align: center; font-size: 0.75rem; color: #374151; font-weight: 600;">✓ 100% Authentic</div>
            <div style="background: #f9fafb; border: 1px solid #ece9f2; border-radius: 0.5rem; padding: 0.65rem; text-align: center; font-size: 0.75rem; color: #374151; font-weight: 600;">↺ Easy Returns</div>
          </div>
        </div>

        <div>
          <a href="/brand/${encodeURIComponent(prod.brand.toLowerCase().replace(/\s+/g, '-'))}" data-spa-nav="/brand/${encodeURIComponent(prod.brand.toLowerCase().replace(/\s+/g, '-'))}" style="display: inline-block; font-size: 0.78rem; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; margin-bottom: 6px;">${esc(prod.brand)} ›</a>
          <h1 style="font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0 0 8px 0; line-height: 1.3;">${esc(prod.name)}</h1>

          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
            <span style="background: #ecfdf5; color: #059669; font-weight: 700; font-size: 0.85rem; padding: 3px 10px; border-radius: 6px;">★ ${prod.rating}</span>
            <span style="font-size: 0.85rem; color: #6b7280;">(${Number(prod.reviews).toLocaleString()} ratings)</span>
            <span style="font-size: 0.8rem; color: #6b7280; background: #f3f4f6; padding: 3px 10px; border-radius: 6px; font-weight: 600;">${esc(prod.weight)}</span>
          </div>

          <div style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 1rem 0; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: baseline; gap: 10px;">
              <span style="font-size: 1.85rem; font-weight: 800; color: #111827;">₹${prod.price}</span>
              ${prod.mrp > prod.price ? `<span style="font-size: 1rem; color: #9ca3af; text-decoration: line-through;">MRP ₹${prod.mrp}</span>` : ''}
              ${discount > 0 ? `<span style="background: #dcfce7; color: #15803d; font-weight: 700; font-size: 0.8rem; padding: 2px 8px; border-radius: 4px;">${discount}% OFF</span>` : ''}
            </div>
            <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: #6b7280;">(Inclusive of all taxes)</p>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 1.5rem;">
            ${qty > 0 ? `
              <div class="qty-stepper" style="flex: 1; justify-content: center; gap: 28px; padding: 0.8rem; font-size: 1.05rem;">
                <button type="button" class="zp-qty-dec" data-url="${esc(prod.url)}" style="font-size: 1.4rem;">−</button>
                <span>${qty} in Cart</span>
                <button type="button" class="zp-qty-inc" data-url="${esc(prod.url)}" style="font-size: 1.4rem;">+</button>
              </div>
            ` : `
              <button type="button" class="zp-add-btn" data-add-url="${esc(prod.url)}" style="flex: 1; background: #ff3269; color: white; padding: 0.85rem 1.5rem; font-size: 1rem; border-radius: 0.5rem;">
                Add to Cart • ₹${prod.price}
              </button>
            `}
            <button type="button" id="pdpOpenCartBtn" style="background: #f5f0ff; color: #3c006b; border: 1px solid #ddd6fe; padding: 0.85rem 1.25rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">
              View Cart
            </button>
          </div>

          <!-- Why Shop From Zepto -->
          <div style="background: #faf9fc; border: 1px solid #ece9f2; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.25rem;">
            <h3 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; font-weight: 700; color: #111827;">Why shop from Zepto?</h3>
            <div style="display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.82rem; color: #4b5563;">
              <div><strong>⚡ Superfast Delivery:</strong> Get your order delivered to your doorstep in 10 minutes from dark stores near you.</div>
              <div><strong>🏷️ Best Prices &amp; Offers:</strong> Cheaper prices than your local supermarket, great cashback offers to top it off.</div>
              <div><strong>🛍️ Wide Assortment:</strong> Choose from 5000+ products across food, personal care, household &amp; other categories.</div>
            </div>
          </div>

          <!-- Highlights -->
          <div>
            <h3 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; font-weight: 700; color: #111827;">Product Information</h3>
            <p style="margin: 0 0 0.75rem 0; font-size: 0.85rem; color: #4b5563; line-height: 1.5;">${esc(prod.desc)}</p>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; font-size: 0.82rem; border-top: 1px solid #f3f4f6; padding-top: 0.75rem;">
              <span style="color: #6b7280;">Brand</span><span style="font-weight: 600; color: #111827;">${esc(prod.brand)}</span>
              <span style="color: #6b7280;">Pack Size</span><span style="font-weight: 600; color: #111827;">${esc(prod.weight)}</span>
              <span style="color: #6b7280;">Category</span><span style="font-weight: 600; color: #111827;">${esc(prod.section)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Similar Products -->
      <section style="margin-top: 2.5rem;">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #111827; margin: 0 0 1rem 0;">Similar Products</h2>
        <div class="zp-prod-grid">
          ${similar.map(renderProductCard).join('')}
        </div>
      </section>
    `;

    showSpaView(html);
    const viewCartBtn = document.getElementById('pdpOpenCartBtn');
    if (viewCartBtn) viewCartBtn.addEventListener('click', openCartDrawer);
  }

  // --- Full Category / Listing Page (PLP) ---
  function renderCategoryPage(title, filterTerms, activePath) {
    const terms = (filterTerms || []).map(t => t.toLowerCase()).filter(t => t && t.length > 2 && !['and', 'more', 'all', 'the', 'for'].includes(t));

    let matched = state.products.filter(p => {
      if (terms.length === 0) return true;
      const hay = `${p.name} ${p.brand} ${p.section} ${p.desc} ${p.url}`.toLowerCase();
      return terms.some(t => hay.includes(t));
    });

    if (matched.length === 0) {
      matched = [...state.products];
    }

    // Apply sort
    if (state.activeSort === 'price-asc') matched.sort((a, b) => a.price - b.price);
    else if (state.activeSort === 'price-desc') matched.sort((a, b) => b.price - a.price);
    else if (state.activeSort === 'rating') matched.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const sidebarItems = [
      ...state.sections.map(s => ({ name: s, url: '/category/' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-') })),
      ...state.categories.filter(c => !state.sections.includes(c.name))
    ];

    const html = `
      <nav class="zp-breadcrumb">
        <a href="/" data-spa-nav="/">Home</a>
        <span>›</span>
        <span style="color: #111827; font-weight: 600;">${esc(title)}</span>
      </nav>

      <div class="zp-plp-layout">
        <aside class="zp-plp-sidebar">
          <div style="padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: #9ca3af; text-transform: uppercase;">Categories</div>
          ${sidebarItems.map(item => {
            const isAct = item.name.toLowerCase() === title.toLowerCase() || (activePath && item.url === activePath);
            return `<div class="zp-sidebar-item ${isAct ? 'active' : ''}" data-spa-nav="${esc(item.url)}">${esc(item.name)}</div>`;
          }).join('')}
        </aside>

        <div>
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 1rem; background: #ffffff; padding: 1rem 1.25rem; border-radius: 0.75rem; border: 1px solid #ece9f2;">
            <div>
              <h1 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #111827;">${esc(title)}</h1>
              <p style="margin: 2px 0 0 0; font-size: 0.82rem; color: #6b7280;">Showing ${matched.length} products • Instant 10-min delivery</p>
            </div>
            <select id="zpSortSelect" style="padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #374151; background: #ffffff; cursor: pointer;">
              <option value="relevance" ${state.activeSort === 'relevance' ? 'selected' : ''}>Sort: Relevance</option>
              <option value="price-asc" ${state.activeSort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-desc" ${state.activeSort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="rating" ${state.activeSort === 'rating' ? 'selected' : ''}>Top Rated</option>
            </select>
          </div>

          <div class="zp-prod-grid">
            ${matched.map(renderProductCard).join('')}
          </div>
        </div>
      </div>
    `;

    showSpaView(html);

    const sortEl = document.getElementById('zpSortSelect');
    if (sortEl) {
      sortEl.addEventListener('change', (e) => {
        state.activeSort = e.target.value;
        renderCategoryPage(title, filterTerms, activePath);
      });
    }
  }

  // --- Full Search Page ---
  function renderSearchPage(initialQuery) {
    const q = (initialQuery || '').trim();
    const matched = q
      ? state.products.filter(p => `${p.name} ${p.brand} ${p.section}`.toLowerCase().includes(q.toLowerCase()))
      : state.products.slice(0, 20);

    const html = `
      <div style="background: #ffffff; border: 1px solid #ece9f2; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 10px; border: 2px solid #7c3aed; border-radius: 0.65rem; padding: 0.65rem 1rem;">
          <span style="font-size: 1.15rem;">🔍</span>
          <input id="zpPageSearchInput" type="text" value="${esc(q)}" placeholder="Search for milk, detergent, rice, chips, ice cream..." style="flex: 1; border: none; outline: none; font-size: 1rem; color: #111827;" />
          ${q ? `<button type="button" id="zpClearSearch" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 1.1rem;">✕</button>` : ''}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0.85rem; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #6b7280;">TRENDING:</span>
          ${['Detergent', 'Rice', 'Oil', 'Ghee', 'Chips', 'Cola', 'Shampoo', 'Dal'].map(tag => `
            <button type="button" class="zp-search-chip" data-q="${tag}" style="background: #f3f4f6; border: none; padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer;">${tag}</button>
          `).join('')}
        </div>
      </div>

      <h2 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">
        ${q ? `Search results for "${esc(q)}" (${matched.length})` : 'Popular Products'}
      </h2>

      ${matched.length === 0 ? `
        <div style="text-align: center; padding: 3rem; background: #ffffff; border-radius: 0.75rem; border: 1px solid #ece9f2;">
          <p style="font-size: 1.1rem; font-weight: 600; color: #374151;">No products matched "${esc(q)}"</p>
          <p style="color: #6b7280; font-size: 0.9rem;">Try searching for Rice, Detergent, Oil, Chips, or Shampoo.</p>
        </div>
      ` : `
        <div class="zp-prod-grid">
          ${matched.map(renderProductCard).join('')}
        </div>
      `}
    `;

    showSpaView(html);
    const inp = document.getElementById('zpPageSearchInput');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      inp.addEventListener('input', (e) => {
        const val = e.target.value;
        clearTimeout(inp._timer);
        inp._timer = setTimeout(() => renderSearchPage(val), 180);
      });
    }
    const clr = document.getElementById('zpClearSearch');
    if (clr) clr.addEventListener('click', () => renderSearchPage(''));
    document.querySelectorAll('.zp-search-chip').forEach(btn => {
      btn.addEventListener('click', () => renderSearchPage(btn.dataset.q));
    });
  }

  // --- Route Resolver ---
  function navigateTo(url, push = true) {
    const clean = (url || '/').replace(/^https?:\/\/[^/]+/, '') || '/';
    if (push && window.location.pathname + window.location.search !== clean) {
      history.pushState(null, '', clean);
    }
    handleRoute();
  }

  function handleRoute() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path === '/' || path === '') {
      showHomeView();
      return;
    }

    if (path.startsWith('/search')) {
      setActiveMenuTab('');
      renderSearchPage(params.get('query') || '');
      return;
    }

    if (path.includes('/pn/')) {
      setActiveMenuTab('');
      const prod = findProductByUrl(path) || state.products[0];
      renderProductPage(prod);
      return;
    }

    // Categories, brands, events, shops, pip, buy-*
    const parts = path.split('/').filter(Boolean);
    let rawSlug = parts[0] || 'Groceries';
    if ((parts[0] === 'cn' || parts[0] === 'category' || parts[0] === 'brand' || parts[0] === 'shop' || parts[0] === 'event' || parts[0] === 'pip') && parts[1]) {
      rawSlug = parts[1];
    }
    const title = rawSlug.replace(/^buy-/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const keywords = rawSlug.replace(/^buy-/, '').split('-');

    if (parts[0] === 'shop') {
      setActiveMenuTab(title);
    } else {
      setActiveMenuTab('');
    }
    renderCategoryPage(title, keywords, path);
  }

  // --- Cart Drawer ---
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
            <p style="font-size: 0.85rem; color: #6b7280; margin: 2px 0 0 0;">${count} ${count === 1 ? 'item' : 'items'} • Delivering in 10 mins</p>
          </div>
          <button type="button" id="closeCartBtn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 4px;">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 1.25rem;">
          ${items.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
              <h3 style="font-size: 1.1rem; font-weight: 600; color: #374151;">Your cart is empty</h3>
              <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem;">Explore categories and add your favorite groceries in minutes!</p>
              <button type="button" id="cartShopNow" style="margin-top: 1.5rem; background: #ff3269; color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Shop Now</button>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${items.map(it => `
                <div style="display: flex; align-items: center; gap: 0.75rem; padding-bottom: 1rem; border-bottom: 1px solid #f3f4f6;">
                  <img src="${esc(it.image)}" alt="${esc(it.name)}" style="width: 56px; height: 56px; object-fit: contain; border-radius: 0.375rem; border: 1px solid #e5e7eb; background: #f9fafb;" />
                  <div style="flex: 1; min-width: 0;">
                    <h4 style="font-size: 0.875rem; font-weight: 600; color: #1f2937; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(it.name)}</h4>
                    <p style="font-size: 0.75rem; color: #6b7280; margin: 2px 0 0 0;">${esc(it.weight || '')}</p>
                    <p style="font-size: 0.85rem; color: #111827; margin: 4px 0 0 0; font-weight: 700;">₹${it.price}</p>
                  </div>
                  <div class="qty-stepper">
                    <button type="button" class="cart-minus" data-id="${esc(it.id)}">−</button>
                    <span>${it.quantity}</span>
                    <button type="button" class="cart-plus" data-id="${esc(it.id)}">+</button>
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
                <span>₹${total + 4}</span>
              </div>
            </div>
          `}
        </div>

        ${items.length > 0 ? `
          <div style="padding: 1.25rem; border-top: 1px solid #e5e7eb; background: #ffffff;">
            <button type="button" id="checkoutBtn" style="width: 100%; background: #ff3269; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 6px -1px rgba(255, 50, 105, 0.4);">
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
          if (state.cart[id].quantity <= 0) delete state.cart[id];
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

  // --- Location Selector Modal ---
  function openLocationModal() {
    const existing = document.getElementById('zeptoLocationModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'zepto-modal-overlay';
    modal.id = 'zeptoLocationModal';

    const cities = [
      'Mumbai 400001, Maharashtra',
      'Bengaluru 560001, Karnataka',
      'Delhi NCR 110001, Delhi',
      'Hyderabad 500001, Telangana',
      'Pune 411001, Maharashtra',
      'Chennai 600001, Tamil Nadu',
      'Kolkata 700001, West Bengal',
      'Ahmedabad 380001, Gujarat'
    ];

    modal.innerHTML = `
      <div class="zepto-modal-card">
        <div style="padding: 1.25rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827;">Select Delivery Location</h3>
          <button type="button" id="closeLocModal" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        <div style="padding: 1.25rem;">
          <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
            <input id="customLocInput" type="text" placeholder="Enter Pincode or City..." value="${esc(state.location)}" style="flex: 1; padding: 0.6rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.9rem;" />
            <button type="button" id="saveCustomLocBtn" style="background: #ff3269; color: white; border: none; padding: 0 1rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer;">Save</button>
          </div>
          <p style="font-size: 0.8rem; font-weight: 600; color: #6b7280; margin: 0 0 0.5rem 0;">POPULAR DELIVERY CITIES (10-MIN ACTIVE)</p>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${cities.map(c => `
              <div class="city-option" data-loc="${esc(c)}" style="padding: 0.65rem 0.75rem; border-radius: 0.375rem; border: 1px solid #e5e7eb; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #374151; display: flex; justify-content: space-between; align-items: center;">
                <span>📍 ${esc(c)}</span>
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
          <button type="button" id="closeLoginModal" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        <div style="padding: 0 1.5rem 2rem 1.5rem;">
          <div style="width: 56px; height: 56px; background: #ffe4e9; color: #ff3269; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin: 0 auto 1rem auto;">⚡</div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0;">Groceries in 10 Minutes</h2>
          <p style="font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0;">Log in or Sign up to access saved addresses and track live orders</p>
          <div style="display: flex; border: 1px solid #d1d5db; border-radius: 0.5rem; overflow: hidden; margin-bottom: 1rem;">
            <span style="background: #f9fafb; padding: 0.75rem 0.85rem; font-weight: 600; font-size: 0.95rem; color: #374151; border-right: 1px solid #d1d5db;">+91</span>
            <input id="loginPhoneInput" type="tel" maxlength="10" placeholder="Enter Phone Number" style="flex: 1; border: none; outline: none; padding: 0.75rem; font-size: 0.95rem;" />
          </div>
          <button type="button" id="sendOtpBtn" style="width: 100%; background: #ff3269; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer;">Continue with Phone</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id === 'closeLoginModal') modal.remove();
    });

    modal.querySelector('#sendOtpBtn').addEventListener('click', () => {
      const phone = modal.querySelector('#loginPhoneInput').value.trim();
      if (/^\d{10}$/.test(phone)) {
        state.user = { phone, name: 'Zepto User' };
        localStorage.setItem('zepto_user', JSON.stringify(state.user));
        updateUserUI();
        showToast(`Logged in with +91 ${phone}`);
        modal.remove();
      } else {
        showToast('Please enter a valid 10-digit mobile number');
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
          <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827;">Confirm &amp; Place Order</h3>
          <button type="button" id="closeCheckoutModal" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #6b7280;">✕</button>
        </div>
        <div style="padding: 1.25rem;">
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">⚡</span>
            <div>
              <p style="margin: 0; font-size: 0.85rem; font-weight: 700; color: #065f46;">Delivering in 10 Mins</p>
              <p style="margin: 0; font-size: 0.8rem; color: #047857;">To: ${esc(state.location)}</p>
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

          <button type="button" id="placeOrderFinalBtn" style="width: 100%; background: #10b981; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer;">
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
          <p style="font-size: 0.95rem; color: #4b5563; margin: 0 0 1.5rem 0;">Your delivery partner is packing your items. Expected arrival in <strong>10 minutes</strong> at ${esc(state.location.split(',')[0])}.</p>
          <button type="button" id="successOkBtn" style="background: #ff3269; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">Awesome, Thanks!</button>
        </div>
      `;
      document.body.appendChild(successModal);
      successModal.querySelector('#successOkBtn').addEventListener('click', () => successModal.remove());
    });
  }

  // --- UI Synchronizers (Safe DOM Selectors Only!) ---
  function updateCartUI() {
    const count = getCartCount();
    const cartBtn = Array.from(document.querySelectorAll('header button')).find(b => b.textContent.includes('Cart'));
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
    const locBtn = Array.from(document.querySelectorAll('header button')).find(
      b => b.textContent.includes('Select Location') || b.classList.contains('__4y7HY')
    );
    if (locBtn) {
      const span = locBtn.querySelector('span') || locBtn.querySelector('h3') || locBtn;
      if (span) span.textContent = state.location.split(',')[0];
    }
  }

  function updateUserUI() {
    const loginBtn = Array.from(document.querySelectorAll('header button')).find(
      b => b.textContent.trim().toLowerCase() === 'login' || b.dataset.zeptoLogin === '1'
    );
    if (loginBtn) {
      loginBtn.dataset.zeptoLogin = '1';
      if (state.user) {
        loginBtn.innerHTML = `<span style="font-weight:700;font-size:13px;">👤 ${esc(state.user.phone.slice(-4))}</span>`;
      }
    }
  }

  // --- Global Event Delegation ---
  function bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      // 1. Dynamic SPA stepper / ADD buttons
      const addBtn = e.target.closest('.zp-add-btn[data-add-url]');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        const prod = findProductByUrl(addBtn.dataset.addUrl);
        addToCart(prod, 1);
        showToast(`Added ${prod ? prod.name.slice(0, 26) : 'item'} to cart`);
        handleRoute();
        return;
      }

      const incBtn = e.target.closest('.zp-qty-inc[data-url]');
      if (incBtn) {
        e.preventDefault();
        e.stopPropagation();
        const prod = findProductByUrl(incBtn.dataset.url);
        addToCart(prod, 1);
        handleRoute();
        return;
      }

      const decBtn = e.target.closest('.zp-qty-dec[data-url]');
      if (decBtn) {
        e.preventDefault();
        e.stopPropagation();
        const prod = findProductByUrl(decBtn.dataset.url);
        addToCart(prod, -1);
        handleRoute();
        return;
      }

      // 2. Dynamic SPA product cards
      const spaCard = e.target.closest('.zp-card[data-prod-url]');
      if (spaCard) {
        e.preventDefault();
        navigateTo(spaCard.dataset.prodUrl);
        return;
      }

      // 3. Sidebar / Breadcrumb SPA navigation
      const spaNav = e.target.closest('[data-spa-nav]');
      if (spaNav) {
        e.preventDefault();
        navigateTo(spaNav.dataset.spaNav);
        return;
      }

      // 4. Homepage "ADD" buttons inside static product cards
      const staticBtn = e.target.closest('button');
      if (staticBtn && staticBtn.textContent.trim().toUpperCase() === 'ADD' && !staticBtn.classList.contains('zp-add-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const card = staticBtn.closest('a[href*="/pn/"]');
        const prod = card ? findProductByUrl(card.getAttribute('href')) : null;
        if (prod) {
          addToCart(prod, 1);
          showToast(`Added ${prod.name.slice(0, 26)} to cart`);
        }
        return;
      }

      // 5. Header buttons (Location, Login, Cart)
      const headerBtn = e.target.closest('header button');
      if (headerBtn) {
        const txt = headerBtn.textContent.toLowerCase();
        if (txt.includes('cart')) {
          e.preventDefault();
          openCartDrawer();
        } else if (txt.includes('login') || headerBtn.dataset.zeptoLogin === '1') {
          e.preventDefault();
          openLoginModal();
        } else if (txt.includes('select location') || headerBtn.classList.contains('__4y7HY') || headerBtn.closest('.a0Ppr')) {
          e.preventDefault();
          openLocationModal();
        }
        return;
      }

      // 6. Top Category Menu Tabs (All, Cafe, Home, Toys, Fresh, Electronics, Mobiles, Beauty, Fashion, Pharmacy)
      const menuTab = e.target.closest('button.__8pvtm');
      if (menuTab) {
        e.preventDefault();
        const label = menuTab.textContent.trim();
        if (label.toLowerCase() === 'all') {
          navigateTo('/');
        } else {
          navigateTo('/shop/' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        }
        return;
      }

      // 7. All internal <a> links (Logo, Search, Products, Categories, Brands, Events, Footer links)
      const anchor = e.target.closest('a[href]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        // Keep external social links external
        if (href.startsWith('http') && !href.includes('zepto.com')) return;

        e.preventDefault();
        navigateTo(href);
      }
    });

    window.addEventListener('popstate', handleRoute);
  }

  // --- Boot ---
  window.addEventListener('DOMContentLoaded', async () => {
    ensureContainers();
    await loadCatalog();
    updateLocationUI();
    updateUserUI();
    updateCartUI();
    bindGlobalEvents();
    handleRoute();
  });
})();
