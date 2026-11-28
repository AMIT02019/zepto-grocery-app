// Shills Professional Storefront (Zepto UI Architecture)
(function () {
  'use strict';

  const state = {
    cart: JSON.parse(localStorage.getItem('shills_cart') || '{}'),
    location: localStorage.getItem('shills_location') || 'Mumbai 400001, Maharashtra',
    user: JSON.parse(localStorage.getItem('shills_user') || 'null'),
    products: [],
    categories: [],
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
    localStorage.setItem('shills_cart', JSON.stringify(state.cart));
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
        brand: prod.brand || 'Shills Professional',
        price: Number(prod.price) || 199,
        mrp: Number(prod.mrp) || Number(prod.price) || 199,
        weight: prod.weight || '1 Unit',
        image: prod.image || '',
        quantity: next
      };
    }
    saveCart();
  }

  async function loadCatalog() {
    try {
      const res = await fetch('/catalog.json');
      if (res.ok) {
        const data = await res.json();
        state.products = data.products || [];
        state.categories = data.categories || [];
      }
    } catch (e) {}
  }

  function ensureContainers() {
    state.homeContainer = document.getElementById('shills-home-root');
    const shell = document.querySelector('.min-h-screen');
    const footer = document.querySelector('footer');
    let spa = document.getElementById('zepto-spa-view');
    if (!spa && shell && footer) {
      spa = document.createElement('div');
      spa.id = 'zepto-spa-view';
      spa.style.display = 'none';
      shell.insertBefore(spa, footer);
    }
    state.spaContainer = spa;
  }

  function setActiveMenuTab(label) {
    document.querySelectorAll('.__8pvtm').forEach(btn => {
      const txt = btn.textContent.trim().toLowerCase();
      const span = btn.querySelector('.c2zll');
      const bar = btn.querySelector('.mh28o');
      if (label && txt === label.toLowerCase()) {
        btn.classList.add('zp-tab-active');
        if (span) span.style.color = '#111111';
        if (bar) { bar.style.opacity = '1'; bar.style.backgroundColor = '#111111'; }
      } else {
        btn.classList.remove('zp-tab-active');
        if (span) span.style.color = '#64748b';
        if (bar) { bar.style.opacity = '0'; }
      }
    });
  }

  function renderCtaControl(prod, fullWidth) {
    const inCart = state.cart[prod.url];
    const qty = inCart ? inCart.quantity : 0;
    if (qty > 0) {
      return `
        <div class="qty-stepper" ${fullWidth ? 'style="flex: 1; justify-content: center; gap: 28px; padding: 0.8rem; font-size: 1.05rem;"' : ''} data-stepper-url="${esc(prod.url)}">
          <button type="button" class="zp-qty-dec" data-url="${esc(prod.url)}" ${fullWidth ? 'style="font-size: 1.4rem;"' : ''}>−</button>
          <span>${fullWidth ? `${qty} in Cart` : qty}</span>
          <button type="button" class="zp-qty-inc" data-url="${esc(prod.url)}" ${fullWidth ? 'style="font-size: 1.4rem;"' : ''}>+</button>
        </div>
      `;
    }
    return `
      <button type="button" class="zp-add-btn" data-add-url="${esc(prod.url)}" ${fullWidth ? 'style="flex: 1; background: #111111; color: white; padding: 0.95rem 1.6rem; font-size: 0.92rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; border-radius: 9999px; border: none; cursor: pointer;"' : ''}>
        ${fullWidth ? `Add to Bag • ₹${prod.price}` : 'ADD'}
      </button>
    `;
  }

  function syncInlineCartButtons(prodUrl) {
    const prod = findProductByUrl(prodUrl);
    if (!prod) return;
    document.querySelectorAll('.zp-cta-slot').forEach(slot => {
      if (slot.dataset.slotUrl === prodUrl) {
        const isFull = slot.dataset.full === '1';
        slot.innerHTML = renderCtaControl(prod, isFull);
      }
    });
  }

  function renderProductCard(p) {
    const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    return `
      <div class="zp-card" data-prod-url="${esc(p.url)}">
        <div>
          <div class="zp-card-img-wrap">
            ${discount > 0 ? `<span class="zp-discount-badge">${discount}% OFF</span>` : ''}
            <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" />
          </div>
          <div class="shills-pro-badge">★ SALON PRO</div>
          <h4 style="margin: 0 0 4px 0; font-size: 0.85rem; font-weight: 600; color: #1f2937; line-height: 1.3; height: 36px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${esc(p.name)}</h4>
          <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(p.weight)}</p>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 6px;">
          <div>
            <span style="font-weight: 800; font-size: 0.95rem; color: #111827;">₹${p.price}</span>
            ${p.mrp > p.price ? `<span style="font-size: 0.75rem; color: #9ca3af; text-decoration: line-through; margin-left: 4px;">₹${p.mrp}</span>` : ''}
          </div>
          <div class="zp-cta-slot" data-slot-url="${esc(p.url)}" data-full="0" style="display: contents;">
            ${renderCtaControl(p, false)}
          </div>
        </div>
      </div>
    `;
  }

  // --- Shills Professional Homepage (Zepto Layout + Rich Sections) ---
  function renderHomePage() {
    if (!state.homeContainer) return;
    document.title = 'Shills Professional - Salon Quality Nail Care, Gel Polish, Beauty & Makeup';

    const banners = [
      {
        img: '/assets/banners/black-friday-sale.jpg',
        title: 'Black Friday to Cyber Monday Sale',
        sub: 'Shop More. Save More. 5% to 25% OFF site-wide on salon essentials!',
        cta: 'Shop Mega Sale',
        url: '/cn/best-selling'
      },
      {
        img: 'https://shillsprofessional.com/cdn/shop/files/Shills_Web_Banner_-_1.png?v=1790592914&width=2400',
        title: 'UV/LED Gel Polish Collection',
        sub: 'Over 120+ vibrant shades with 21-day chip-free salon shine',
        cta: 'Shop Gel Polish',
        url: '/cn/gel-polish'
      },
      {
        img: 'https://shillsprofessional.com/cdn/shop/files/Shills_Web_Banner_-_2.png?v=1790592914&width=2400',
        title: 'Professional Cat Eye & Glitters',
        sub: 'Magical 9D magnetic effects for stunning nail artistry',
        cta: 'Explore Cat Eye',
        url: '/cn/cat-eye-kit'
      },
      {
        img: 'https://shillsprofessional.com/cdn/shop/files/Shills_Web_Banner_-_3.png?v=1790592914&width=2400',
        title: 'Pro Nail Extensions & Lamps',
        sub: 'Salon-grade UV/LED lamps, tips & builder gels delivered in minutes',
        cta: 'View Nail Tools',
        url: '/cn/nail-lamp'
      }
    ];

    const bannerHtml = `
      <div class="shills-banner-slider" id="homeBannerSlider">
        <div class="shills-slide-track" id="homeSlideTrack">
          ${banners.map(b => `
            <div class="shills-slide-item" data-spa-nav="${esc(b.url)}">
              <img src="${esc(b.img)}" alt="${esc(b.title)}" />
            </div>
          `).join('')}
        </div>
        <button type="button" class="shills-slider-btn shills-slider-prev" id="sliderPrev">‹</button>
        <button type="button" class="shills-slider-btn shills-slider-next" id="sliderNext">›</button>
        <div class="shills-slider-dots" id="sliderDots">
          ${banners.map((_, i) => `<div class="shills-dot ${i === 0 ? 'active' : ''}" data-slide="${i}"></div>`).join('')}
        </div>
      </div>
    `;

    const trustBarHtml = `
      <div class="shills-trust-bar">
        <div class="shills-trust-item">
          <div class="shills-trust-icon">💅</div>
          <div>
            <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827;">Salon-Grade Formulas</h4>
            <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #6b7280;">Trusted by 5,000+ nail studios &amp; artists</p>
          </div>
        </div>
        <div class="shills-trust-item">
          <div class="shills-trust-icon">⚡</div>
          <div>
            <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827;">Superfast Delivery</h4>
            <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #6b7280;">Instant doorstep dispatch in minutes</p>
          </div>
        </div>
        <div class="shills-trust-item">
          <div class="shills-trust-icon">✓</div>
          <div>
            <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827;">100% Genuine &amp; Toxin-Free</h4>
            <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #6b7280;">Direct from official Shills inventory</p>
          </div>
        </div>
        <div class="shills-trust-item">
          <div class="shills-trust-icon">💬</div>
          <div>
            <h4 style="margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827;">Dedicated Pro Support</h4>
            <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: #6b7280;">Expert help for artists &amp; salon owners</p>
          </div>
        </div>
      </div>
    `;

    const catGridHtml = `
      <section style="margin-bottom: 2.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <h2 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #111827;">Shop by Category</h2>
            <p style="margin: 3px 0 0 0; font-size: 0.82rem; color: #6b7280;">Explore salon-grade nail care, extensions, accessories &amp; beauty</p>
          </div>
          <a href="/cn/best-selling" data-spa-nav="/cn/best-selling" style="color: #3c006b; font-weight: 700; font-size: 0.875rem; text-decoration: none;">See All ›</a>
        </div>
        <div class="shills-cat-grid">
          ${state.categories.map(c => `
            <div class="shills-cat-tile" data-spa-nav="${esc(c.url)}">
              <div class="shills-cat-img">
                <img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" />
              </div>
              <span style="font-size: 0.78rem; font-weight: 600; color: #1f2937; line-height: 1.25;">${esc(c.name)}</span>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    // Curated Shoppable Reels / Watch & Buy Section
    const reels = [
      {
        id: "reel-1",
        title: "Uv/Led 9d Silk Cat Rye Soak Off Gel Polish...",
        fullTitle: "Uv/Led 9d Silk Cat Rye Soak Off Gel Polish Magnetic Gel Nail Polish With Silky Velvet Shimmer",
        price: "569",
        mrp: "749",
        handle: "silk-9d-cat-eye-gel-polish-7-5ml",
        url: "/pn/silk-9d-cat-eye-gel-polish-7-5ml",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/15620164b1f34c4e9a16e70f7e8c1ec8.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/15620164b1f34c4e9a16e70f7e8c1ec8.thumbnail.0000000000.jpg?v=1792058889",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/15620164b1f34c4e9a16e70f7e8c1ec8.thumbnail.0000000000.jpg?v=1792058889"
      },
      {
        id: "reel-2",
        title: "Cat Eye Gel Polish Kit",
        fullTitle: "Cat Eye Gel Polish Kit - Professional 9D Magnetic Nail Art Set",
        price: "4,499",
        mrp: "5,999",
        handle: "cat-eye-gel-polish-kit",
        url: "/pn/cat-eye-gel-polish-kit",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/190be95f8b55417ea0aa79af136773da.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/190be95f8b55417ea0aa79af136773da.thumbnail.0000000000.jpg?v=1772784326",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/190be95f8b55417ea0aa79af136773da.thumbnail.0000000000.jpg?v=1772784326"
      },
      {
        id: "reel-3",
        title: "Non Transfer Lip Gloss",
        fullTitle: "Non Transfer Lip Gloss - Waterproof All Day Velvet Matte",
        price: "404",
        mrp: "449",
        handle: "non-transfer-lip-gloss",
        url: "/pn/non-transfer-lip-gloss",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/30026a04b6474cc781f75be294e7fcb2.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/30026a04b6474cc781f75be294e7fcb2.thumbnail.0000000000.jpg?v=1766399668",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/30026a04b6474cc781f75be294e7fcb2.thumbnail.0000000000.jpg?v=1766399668"
      },
      {
        id: "reel-4",
        title: "Uv/Led 9d Silk Cat Rye Soak Off Gel Polish...",
        fullTitle: "Uv/Led 9d Silk Cat Rye Soak Off Gel Polish Magnetic Gel Nail Polish With Silky Velvet Shimmer",
        price: "569",
        mrp: "749",
        handle: "silk-9d-cat-eye-gel-polish-7-5ml",
        url: "/pn/silk-9d-cat-eye-gel-polish-7-5ml",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/2f36aa7e14ec483fa9a40350aba885f6.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/2f36aa7e14ec483fa9a40350aba885f6.thumbnail.0000000000.jpg?v=1792059494",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/15620164b1f34c4e9a16e70f7e8c1ec8.thumbnail.0000000000.jpg?v=1792058889"
      },
      {
        id: "reel-5",
        title: "Cat Eye Gel Polish Kit",
        fullTitle: "Cat Eye Gel Polish Kit - Professional 9D Magnetic Nail Art Set",
        price: "4,499",
        mrp: "5,999",
        handle: "cat-eye-gel-polish-kit",
        url: "/pn/cat-eye-gel-polish-kit",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/a5407ca85eb540f691f47f13e93277ec.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/a5407ca85eb540f691f47f13e93277ec.thumbnail.0000000000.jpg?v=1772790886",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/190be95f8b55417ea0aa79af136773da.thumbnail.0000000000.jpg?v=1772784326"
      },
      {
        id: "reel-6",
        title: "Non Transfer Lip Gloss",
        fullTitle: "Non Transfer Lip Gloss - Waterproof All Day Velvet Matte",
        price: "404",
        mrp: "449",
        handle: "non-transfer-lip-gloss",
        url: "/pn/non-transfer-lip-gloss",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/30026a04b6474cc781f75be294e7fcb2.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/30026a04b6474cc781f75be294e7fcb2.thumbnail.0000000000.jpg?v=1766399668",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/30026a04b6474cc781f75be294e7fcb2.thumbnail.0000000000.jpg?v=1766399668"
      },
      {
        id: "reel-7",
        title: "12 In 1 Nail Therapy",
        fullTitle: "12 In 1 Nail Therapy Multi-Benefit Nail Treatment",
        price: "474",
        mrp: "499",
        handle: "12-in-1-nail-therapy",
        url: "/pn/12-in-1-nail-therapy",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/c86fd16d11d54d7a822149620c2772c3.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/c86fd16d11d54d7a822149620c2772c3.thumbnail.0000000000.jpg?v=1792058895",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/c86fd16d11d54d7a822149620c2772c3.thumbnail.0000000000.jpg?v=1792058895"
      },
      {
        id: "reel-8",
        title: "Solid Tip Bond Gel",
        fullTitle: "Solid Tip Bond Gel for Seamless Long-Wear Extensions",
        price: "499",
        mrp: "699",
        handle: "shills-solid-tip-bond-spn-21045",
        url: "/pn/shills-solid-tip-bond-spn-21045",
        videoUrl: "https://cdn.shopify.com/videos/c/o/v/5998ef6e948b4be8bd31981824d66aee.mp4",
        poster: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/5998ef6e948b4be8bd31981824d66aee.thumbnail.0000000000.jpg?v=1792566907",
        productImg: "https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/5998ef6e948b4be8bd31981824d66aee.thumbnail.0000000000.jpg?v=1792566907"
      }
    ];

    const reelsSectionHtml = `
      <section class="shills-reels-section">
        <div class="shills-reels-header">
          <div>
            <span style="color: #3c006b; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Trending On Social</span>
            <h2 style="font-size: 1.45rem; font-weight: 900; color: #111827; margin: 0.25rem 0 0 0;">Watch &amp; Buy Salon Looks</h2>
          </div>
          <span style="font-size: 0.85rem; color: #6b7280; font-weight: 500;">Hover or click reel to play with sound</span>
        </div>
        <div class="shills-reels-slider-wrapper">
          <button type="button" class="shills-reels-nav-btn shills-reels-prev" id="reelsPrev" aria-label="Previous Reels">‹</button>
          <div class="shills-reels-track" id="reelsTrack">
            ${reels.map(r => `
              <div class="shills-reel-card" data-reel-id="${esc(r.id)}" data-video-url="${esc(r.videoUrl)}" data-prod-url="${esc(r.url)}">
                <div class="shills-reel-watermark">SHILLS</div>
                <video class="shills-reel-video" src="${esc(r.videoUrl)}" poster="${esc(r.poster)}" loop muted playsinline preload="metadata"></video>
                <div class="shills-reel-play-indicator">▶</div>
                <div class="shills-reel-product-pill" data-spa-nav="${esc(r.url)}">
                  <img src="${esc(r.productImg)}" alt="${esc(r.title)}" class="shills-reel-prod-thumb" />
                  <div class="shills-reel-prod-details">
                    <span class="shills-reel-prod-title" title="${esc(r.fullTitle)}">${esc(r.title)}</span>
                    <span class="shills-reel-prod-price">₹ ${esc(r.price)}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <button type="button" class="shills-reels-nav-btn shills-reels-next" id="reelsNext" aria-label="Next Reels">›</button>
        </div>
      </section>
    `;

    // Featured Product Carousels
    const topSections = ['Gel Polish', 'Nail Art', 'UV/LED Nail Lamps', 'Nail Extensions'];
    const bottomSections = ['Skincare', 'Makeup'];

    const renderSec = (secName) => {
      const items = state.products.filter(p => p.section === secName).slice(0, 6);
      if (items.length === 0) return '';
      const catObj = state.categories.find(c => c.name === secName);
      const secUrl = catObj ? catObj.url : `/cn/${secName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      return `
        <section style="margin-bottom: 2.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827;">${esc(secName)}</h3>
              <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: #6b7280;">High-performance professional formulas</p>
            </div>
            <a href="${esc(secUrl)}" data-spa-nav="${esc(secUrl)}" style="color: #3c006b; font-weight: 700; font-size: 0.875rem; text-decoration: none;">View All (${state.products.filter(p => p.section === secName).length}) ›</a>
          </div>
          <div class="zp-prod-grid">
            ${items.map(renderProductCard).join('')}
          </div>
        </section>
      `;
    };

    const topSectionsHtml = topSections.map(renderSec).join('');
    const bottomSectionsHtml = bottomSections.map(renderSec).join('');

    // Refined Beauty Promotional Banner
    const refinedBeautyBannerHtml = `
      <div class="shills-promo-banner-card" data-spa-nav="/cn/makeup">
        <img src="/assets/banners/refined-beauty.jpg" alt="Refined Beauty Timeless Elegance - Shills Professional" loading="lazy" />
      </div>
    `;

    // Video Section
    const videoSectionHtml = `
      <section class="shills-video-section">
        <div class="shills-video-box">
          <iframe
            src="https://www.youtube-nocookie.com/embed/videoseries?list=PLw-nQ4745j0zGf3_T5w6Yk1-y9k4B9g2A"
            title="Shills Professional Nail Art Masterclasses"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        </div>
        <div>
          <span style="background: #f3e8ff; color: #7c3aed; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">Studio Masterclasses</span>
          <h2 style="font-size: 1.65rem; font-weight: 900; color: #111827; margin: 0.6rem 0 0.85rem 0; line-height: 1.25;">How to Create 9D Cat Eye &amp; Builder Gel Extensions</h2>
          <p style="font-size: 0.9rem; color: #4b5563; line-height: 1.6; margin-bottom: 1.25rem;">Watch top Indian nail educators and salon technicians demonstrate step-by-step techniques using Shills UV/LED Gel Polishes, magnetic wands, and poly gels.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <button type="button" data-spa-nav="/cn/cat-eye-kit" style="background: #111111; color: white; border: none; padding: 0.75rem 1.4rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(255,50,105,0.3);">Shop Featured Kit →</button>
            <a href="https://www.youtube.com/@ShillsProfessional.Official" target="_blank" rel="noopener" style="background: #f3f4f6; color: #111827; padding: 0.75rem 1.25rem; border-radius: 0.5rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">Watch on YouTube ↗</a>
          </div>
        </div>
      </section>
    `;

    // Customer Reviews & Testimonials
    const reviews = [
      {
        name: 'Pooja Sharma',
        role: 'Salon Owner, Mumbai',
        stars: 5,
        title: 'Best Gel Polish in India!',
        text: 'The pigmentation and consistency of Shills Gel Polish is unmatched. It lasts a full 3 weeks without chipping or peeling. My clients love the finish!'
      },
      {
        name: 'Ananya Verma',
        role: 'Certified Nail Artist, Delhi',
        stars: 5,
        title: 'Game changer for Cat Eye art',
        text: 'The 9D Cat Eye kit and magnetic wand are top-tier. Creates sharp light lines within 5 seconds under the Shills UV lamp.'
      },
      {
        name: 'Sneha Patel',
        role: 'Studio Educator, Bengaluru',
        stars: 5,
        title: 'High-speed delivery is a lifesaver',
        text: 'Running out of top coat or monomer during a busy wedding season booking used to be a nightmare. Now I get it delivered immediately.'
      },
      {
        name: 'Ritu Kapoor',
        role: 'Professional Makeup Artist',
        stars: 5,
        title: 'Thermal heat protectant & makeup',
        text: 'Shills skincare and hair prep sprays hold up beautifully under heavy bridal studio lighting. 100% recommended for every beauty kit.'
      }
    ];

    const reviewsHtml = `
      <section style="margin-bottom: 2.75rem;">
        <div style="text-align: center; max-width: 620px; margin: 0 auto 1.75rem auto;">
          <span style="color: #7c3aed; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Artist Feedback</span>
          <h2 style="font-size: 1.65rem; font-weight: 900; color: #111827; margin: 0.35rem 0 0.5rem 0;">Loved by 10,000+ Beauty Professionals</h2>
          <p style="font-size: 0.88rem; color: #6b7280; margin: 0;">Real reviews from verified salon owners, nail technicians, and freelance artists across India.</p>
        </div>
        <div class="shills-reviews-grid">
          ${reviews.map(r => `
            <div class="shills-review-card">
              <div>
                <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 6px;">${'★'.repeat(r.stars)}</div>
                <h4 style="font-size: 0.95rem; font-weight: 700; color: #111827; margin: 0 0 6px 0;">"${esc(r.title)}"</h4>
                <p style="font-size: 0.85rem; color: #4b5563; line-height: 1.5; margin: 0 0 1rem 0;">${esc(r.text)}</p>
              </div>
              <div style="border-top: 1px solid #f3f4f6; padding-top: 0.75rem; display: flex; align-items: center; gap: 8px;">
                <div style="width: 34px; height: 34px; border-radius: 50%; background: #f3e8ff; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem;">${r.name[0]}</div>
                <div>
                  <div style="font-size: 0.82rem; font-weight: 700; color: #111827;">${esc(r.name)}</div>
                  <div style="font-size: 0.72rem; color: #6b7280;">${esc(r.role)}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    // FAQ Section
    const faqs = [
      {
        q: 'What makes Shills Professional products salon-grade?',
        a: 'Shills Professional formulations use high-grade European resins and pigments engineered specifically for high adhesion, vibrant color payoff, and 21+ days of chip-resistant wear under professional UV/LED lamps.'
      },
      {
        q: 'How long do Shills Gel Polishes need to be cured?',
        a: 'Under a 48W or higher Shills UV/LED Nail Lamp, base coats cure in 30 seconds, color gel coats in 60 seconds, and no-wipe top coats in 60 seconds.'
      },
      {
        q: 'Do you offer bulk/B2B pricing for salons and beauty academies?',
        a: 'Yes! We supply beauty academies, nail bars, and salon chains across India with exclusive wholesale tiers and combo kits. You can connect via our Pro Support.'
      },
      {
        q: 'How fast is delivery?',
        a: 'We offer instant local delivery in select metro zones and 1-3 day express courier across the rest of India with live order tracking.'
      },
      {
        q: 'What is your return & exchange policy?',
        a: 'We offer easy replacements for any transit-damaged or defective electrical appliances (lamps, drills) within 7 days of delivery.'
      }
    ];

    const faqSectionHtml = `
      <section class="shills-faq-section">
        <div style="margin-bottom: 1.25rem;">
          <span style="color: #7c3aed; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em;">Got Questions?</span>
          <h2 style="font-size: 1.5rem; font-weight: 900; color: #111827; margin: 0.35rem 0 0 0;">Frequently Asked Questions</h2>
        </div>
        <div>
          ${faqs.map((f, i) => `
            <details class="shills-faq-item" ${i === 0 ? 'open' : ''}>
              <summary>${esc(f.q)} <span>▾</span></summary>
              <p>${esc(f.a)}</p>
            </details>
          `).join('')}
        </div>
      </section>
    `;

    // Partner Marketplace Channels
    const partnersHtml = `
      <section class="shills-partners-bar">
        <span style="font-size: 0.85rem; font-weight: 700; color: #6b7280; text-transform: uppercase;">Official Brand Store Also On:</span>
        <div style="display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap;">
          <img src="https://shillsprofessional.com/cdn/shop/files/pngfind.com-flipkart-logo-png-3288902.webp?height=72&v=1765284198" alt="Flipkart" style="height: 28px; width: auto; object-fit: contain;" />
          <img src="https://shillsprofessional.com/cdn/shop/files/pngwing.com_1.webp?height=72&v=1765284207" alt="Amazon" style="height: 28px; width: auto; object-fit: contain;" />
          <img src="https://shillsprofessional.com/cdn/shop/files/zepto-logo.jpg?height=64&v=1786456660" alt="Zepto" style="height: 26px; width: auto; object-fit: contain; border-radius: 4px;" />
        </div>
      </section>
    `;

    state.homeContainer.innerHTML = `
      <div style="padding: 0;">
        ${bannerHtml}
        ${trustBarHtml}
        ${catGridHtml}
        ${reelsSectionHtml}
        ${topSectionsHtml}
        ${refinedBeautyBannerHtml}
        ${bottomSectionsHtml}
        ${videoSectionHtml}
        ${reviewsHtml}
        ${faqSectionHtml}
        ${partnersHtml}
      </div>
    `;

    // Initialize Banner Carousel & Reels Slider
    initBannerSlider(banners.length);
    initReelsSlider(reels);
  }

  function initBannerSlider(totalSlides) {
    let currentSlide = 0;
    const track = document.getElementById('homeSlideTrack');
    const dots = document.querySelectorAll('.shills-dot');
    const prev = document.getElementById('sliderPrev');
    const next = document.getElementById('sliderNext');
    if (!track) return;

    function goToSlide(idx) {
      currentSlide = (idx + totalSlides) % totalSlides;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    }

    if (prev) prev.addEventListener('click', () => goToSlide(currentSlide - 1));
    if (next) next.addEventListener('click', () => goToSlide(currentSlide + 1));
    dots.forEach(d => {
      d.addEventListener('click', () => goToSlide(Number(d.dataset.slide)));
    });

    // Auto-advance banner every 4.5 seconds
    clearInterval(track._autoTimer);
    track._autoTimer = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 4500);
  }

  function initReelsSlider(reels) {
    const track = document.getElementById('reelsTrack');
    const prev = document.getElementById('reelsPrev');
    const next = document.getElementById('reelsNext');
    if (!track) return;

    if (prev) {
      prev.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: -460, behavior: 'smooth' });
      });
    }
    if (next) {
      next.addEventListener('click', (e) => {
        e.stopPropagation();
        track.scrollBy({ left: 460, behavior: 'smooth' });
      });
    }

    const cards = track.querySelectorAll('.shills-reel-card');
    cards.forEach(card => {
      const video = card.querySelector('video');
      const pill = card.querySelector('.shills-reel-product-pill');

      // Video play on hover
      card.addEventListener('mouseenter', () => {
        if (video) {
          card.classList.add('is-playing');
          video.play().catch(() => {});
        }
      });
      card.addEventListener('mouseleave', () => {
        if (video) {
          card.classList.remove('is-playing');
          video.pause();
          video.currentTime = 0;
        }
      });

      // Product pill click
      if (pill) {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          const url = pill.getAttribute('data-spa-nav');
          if (url) navigateTo(url);
        });
      }

      // Card click opens modal to view full reel with audio and shop button
      card.addEventListener('click', (e) => {
        if (e.target.closest('.shills-reel-product-pill')) return;
        const reelId = card.getAttribute('data-reel-id');
        const reel = reels.find(r => r.id === reelId);
        if (reel) openReelModal(reel);
      });
    });
  }

  function openReelModal(reel) {
    const existing = document.getElementById('shillsReelModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'shillsReelModal';
    modal.className = 'zepto-modal-overlay';
    modal.innerHTML = `
      <div style="position: relative; max-width: 400px; width: 92%; background: #000; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        <button type="button" id="closeReelModal" style="position: absolute; top: 12px; right: 12px; z-index: 10; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.6); color: #fff; border: none; font-size: 1.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">×</button>
        <div style="aspect-ratio: 9/16; width: 100%; position: relative;">
          <video id="modalReelVideo" src="${esc(reel.videoUrl)}" autoplay loop playsinline controls style="width: 100%; height: 100%; object-fit: cover; display: block;"></video>
        </div>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 14px; background: linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4), transparent); z-index: 5;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); padding: 8px 12px; border-radius: 12px;">
            <img src="${esc(reel.productImg)}" alt="${esc(reel.title)}" style="width: 42px; height: 42px; border-radius: 8px; object-fit: cover; flex-shrink: 0;" />
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.8rem; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(reel.title)}</div>
              <div style="font-size: 0.88rem; font-weight: 800; color: #3c006b; margin-top: 1px;">₹ ${esc(reel.price)}</div>
            </div>
            <button type="button" id="reelBuyNowBtn" style="background: #3c006b; color: #fff; border: none; padding: 7px 12px; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; white-space: nowrap;">Shop Now →</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('closeReelModal');
    const video = document.getElementById('modalReelVideo');
    const buyBtn = document.getElementById('reelBuyNowBtn');

    function closeModal() {
      if (video) video.pause();
      modal.remove();
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        closeModal();
        navigateTo(reel.url);
      });
    }
  }


  // --- Shills Professional Mega Menu Data & Interactions ---
  const megaMenuData = {
    'gel-polish': {
      title: 'Gel Polish Systems',
      categoryUrl: '/cn/gel-polish',
      columns: [
        {
          heading: 'By Finish & Effect',
          links: [
            { text: '9D Silk Cat Eye Gel Polish', url: '/pn/silk-9d-cat-eye-gel-polish-7-5ml', badge: 'HOT' },
            { text: '120+ Solid Gel Color Shades', url: '/cn/gel-polish', badge: '120+ SHADES' },
            { text: 'Laser Glitter & Shimmer', url: '/cn/cat-eye-kit' },
            { text: 'Jelly & Transparent Glass Gel', url: '/cn/gel-polish' },
            { text: 'Platinum & Metallic Foil Gel', url: '/cn/gel-polish' },
            { text: 'Red Wine & Deep Autumn Collection', url: '/cn/gel-polish' }
          ]
        },
        {
          heading: 'Top & Base Systems',
          links: [
            { text: 'Diamond No-Wipe Top Coat', url: '/cn/top-coat', badge: 'POPULAR' },
            { text: 'Russian Glass Base Coat', url: '/cn/top-coat' },
            { text: 'Rubber Base Gel for Soft Nails', url: '/cn/top-coat' },
            { text: 'Velvet Matte Top Coat', url: '/cn/top-coat' },
            { text: '3D Water Drop Emboss Gel', url: '/pn/water-drop-top-coat' },
            { text: 'Hard Gel Peel-Off Base', url: '/cn/top-coat' }
          ]
        },
        {
          heading: 'Prep, Remover & Care',
          links: [
            { text: 'Dehydrator & Acid-Free Primer', url: '/cn/nail-prep', badge: 'MUST-HAVE' },
            { text: '12-in-1 Nail Therapy Polish', url: '/pn/12-in-1-nail-therapy' },
            { text: 'Cuticle Revitalizer Oil Pens', url: '/cn/nail-prep' },
            { text: 'Fast Gel Soak-Off Remover', url: '/cn/nail-prep' },
            { text: '401 Rapid Tip Bond Glue', url: '/cn/nail-prep' }
          ]
        }
      ],
      spotlight: {
        tag: 'BESTSELLER',
        title: '9D Silk Cat Eye Gel Polish (7.5ml)',
        price: '569',
        mrp: '749',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/357.jpg?v=1771414507',
        url: '/pn/silk-9d-cat-eye-gel-polish-7-5ml'
      },
      promo: {
        badge: 'SALON FORMULA',
        title: 'Chip-Free 21-Day Wear',
        desc: 'Engineered with premium European resins for maximum adhesion, self-leveling glide, and salon gloss.',
        cta: 'Shop Gel Polish →',
        url: '/cn/gel-polish'
      }
    },

    'nail-art': {
      title: 'Nail Art Studio',
      categoryUrl: '/cn/nail-art',
      columns: [
        {
          heading: '3D Art & Textures',
          links: [
            { text: '3D Water Droplet Top Coat', url: '/pn/water-drop-top-coat', badge: 'TRENDING' },
            { text: 'Embossing Texture Gels', url: '/cn/nail-art' },
            { text: 'Chrome & Holographic Pigments', url: '/cn/nail-art' },
            { text: 'Gold & Silver Metallic Foils', url: '/cn/nail-art' },
            { text: 'Spider Gel Line Art', url: '/cn/nail-art' }
          ]
        },
        {
          heading: 'Pro Brushes & Tools',
          links: [
            { text: '14-Piece Precision Brush Kit', url: '/cn/nail-brush', badge: 'PRO CHOICE' },
            { text: 'Ultra-Fine Liner Art Brushes', url: '/cn/nail-brush' },
            { text: 'Ombre & Gradient Sponge Tools', url: '/cn/nail-brush' },
            { text: 'Double-Ended Dotting Tools', url: '/cn/nail-tool' },
            { text: 'Glass Color Mixing Palettes', url: '/cn/nail-tool' }
          ]
        },
        {
          heading: 'Glitters & Accessories',
          links: [
            { text: 'Laser Shimmer Powders', url: '/cn/cat-eye-kit' },
            { text: 'Crystal Rhinestones & Charms', url: '/cn/nail-art' },
            { text: 'French Manicure Guide Tapes', url: '/cn/nail-art' },
            { text: 'Magnetic Cat Eye Wands', url: '/cn/cat-eye-kit' }
          ]
        }
      ],
      spotlight: {
        tag: 'NEW LAUNCH',
        title: 'Water Drop Top Coat for 3D Art',
        price: '539',
        mrp: '699',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/Enlarged_pastel-blue_water-drop_nail_art.png?v=1795687422',
        url: '/pn/water-drop-top-coat'
      },
      promo: {
        badge: 'PRO MASTERCLASS',
        title: 'Master Modern 3D Nail Art',
        desc: 'Elevate your salon services with embossed gel techniques and velvet magnetic reflections.',
        cta: 'Explore Nail Art →',
        url: '/cn/nail-art'
      }
    },

    'nail-tips': {
      title: 'Extensions & Full Cover Tips',
      categoryUrl: '/cn/nail-tips',
      columns: [
        {
          heading: 'Soft Gel & Press-On Tips',
          links: [
            { text: 'Full Cover Coffin & Almond Tips', url: '/cn/nail-tips', badge: 'HOT' },
            { text: 'C-Curve Square Pro Extensions', url: '/cn/nail-tips' },
            { text: 'Press On Nails Collection', url: '/cn/press-on-nails-1' },
            { text: 'Pre-Buffed Fast Application Tips', url: '/cn/nail-tips' }
          ]
        },
        {
          heading: 'Poly & Builder Systems',
          links: [
            { text: 'Poly Gel Natural Nail Overlays Kit', url: '/pn/poly-gel-kit-spn-21096', badge: 'TOP SELLER' },
            { text: 'Hard Builder Gel in a Bottle', url: '/cn/nail-extension' },
            { text: 'Acrylic Powder & Monomer Liquid', url: '/cn/nail-extension' },
            { text: 'Dual Forms Extension Moulds', url: '/cn/nail-extension' }
          ]
        },
        {
          heading: 'Adhesives & Solutions',
          links: [
            { text: 'Solid Tip Bond Gel (Spn-21045)', url: '/pn/shills-solid-tip-bond-spn-21045', badge: 'POPULAR' },
            { text: 'Anti-Stick Slip Solution 100ml', url: '/cn/nail-extension' },
            { text: 'Ultra Strong 401 Tip Glue', url: '/cn/nail-prep' }
          ]
        }
      ],
      spotlight: {
        tag: 'MASTER KIT',
        title: 'Poly Gel Extension Master Kit',
        price: '3,134',
        mrp: '3,999',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/SPN-21096_6.jpg?v=1766482254',
        url: '/pn/poly-gel-kit-spn-21096'
      },
      promo: {
        badge: 'ZERO LIFTING',
        title: 'Seamless 4-Week Extensions',
        desc: 'Lightweight, unbreakable poly gels that cure in just 60 seconds with zero odor.',
        cta: 'Shop Extensions →',
        url: '/cn/nail-extension'
      }
    },

    'nail-lamp': {
      title: 'UV/LED Lamps & Salon Electricals',
      categoryUrl: '/cn/nail-lamp',
      columns: [
        {
          heading: 'UV/LED Curing Lamps',
          links: [
            { text: 'High-Power 48W/72W Smart Lamps', url: '/cn/nail-lamp', badge: 'PRO' },
            { text: 'Blush Beam Smart UV Lamp', url: '/cn/nail-lamp', badge: 'FEATURED' },
            { text: 'Portable Cordless Flash Cure Torch', url: '/cn/nail-lamp' },
            { text: 'Low-Heat Sensor Preset Lamps', url: '/cn/nail-lamp' }
          ]
        },
        {
          heading: 'Electric Drills (E-Files)',
          links: [
            { text: '35,000 RPM Professional Drill', url: '/cn/nail-tool', badge: 'MUST-HAVE' },
            { text: 'Carbide & Ceramic Drill Bits', url: '/cn/nail-tool' },
            { text: 'Sanding Bands & Mandrels', url: '/cn/nail-tool' },
            { text: 'Desktop Dust Vacuum Collector', url: '/cn/nail-tool' }
          ]
        },
        {
          heading: 'Hand Tools & Sanitization',
          links: [
            { text: 'Surgical Steel Cuticle Nippers', url: '/cn/nail-tool' },
            { text: 'Double-Ended Cuticle Pushers', url: '/cn/nail-tool' },
            { text: '100/180 Grit Salon Emery Boards', url: '/cn/nail-tool' },
            { text: 'Four-Way High Shine Buffers', url: '/cn/nail-tool' }
          ]
        }
      ],
      spotlight: {
        tag: 'WARRANTY INCLUDED',
        title: 'Manicure Hand Rest UV Lamp SPN-2105',
        price: '1,899',
        mrp: '2,499',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/SPN-21056.jpg?v=1766498171',
        url: '/cn/nail-lamp'
      },
      promo: {
        badge: '7-DAY WARRANTY',
        title: 'Even 360° Flash Curing',
        desc: 'Engineered with dual optical wavelengths (365nm+405nm) to eliminate dead curing zones.',
        cta: 'View All Lamps →',
        url: '/cn/nail-lamp'
      }
    },

    'nail-tool': {
      title: 'Precision Tools & Salon Hardware',
      categoryUrl: '/cn/nail-tool',
      columns: [
        {
          heading: 'Precision Hand Tools',
          links: [
            { text: 'Cuticle Nippers & Clippers', url: '/cn/nail-tool', badge: 'PRO' },
            { text: 'Double-Ended Scrapers', url: '/cn/nail-tool' },
            { text: 'Precision Tweezers for Rhinestones', url: '/cn/nail-tool' },
            { text: 'Glass Cuticle Pushers', url: '/cn/nail-tool' }
          ]
        },
        {
          heading: 'Files & Buffers',
          links: [
            { text: '100/180 Grit Zebra Files', url: '/cn/nail-tool', badge: 'BULK PACK' },
            { text: 'High-Shine Diamond Buffers', url: '/cn/nail-tool' },
            { text: 'Sponge Buffers for Prep', url: '/cn/nail-tool' }
          ]
        },
        {
          heading: 'Sanitation & Safety',
          links: [
            { text: 'Sterilization Trays & Jars', url: '/cn/nail-tool' },
            { text: 'Lint-Free Nail Wipes', url: '/cn/nail-tool' },
            { text: 'Pump Dispenser Bottles', url: '/cn/nail-tool' }
          ]
        }
      ],
      spotlight: {
        tag: 'SALON GRADE',
        title: 'Stainless Steel Cuticle Nipper Pro',
        price: '449',
        mrp: '599',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/357.jpg?v=1771414507',
        url: '/cn/nail-tool'
      },
      promo: {
        badge: 'PRO HARDWARE',
        title: 'Surgical Grade Stainless Steel',
        desc: 'Autoclave-safe instruments engineered for high durability in busy salon environments.',
        cta: 'Shop Tools →',
        url: '/cn/nail-tool'
      }
    },

    'skin-care': {
      title: 'Skincare & Pro Facial Care',
      categoryUrl: '/cn/skin-care',
      columns: [
        {
          heading: 'Salon 6-Step Facial Kits',
          links: [
            { text: 'Retinol Skin Renewal Facial Kit', url: '/pn/retinol-facial-kit', badge: 'BESTSELLER' },
            { text: 'Vitamin C Brightening Facial Kit', url: '/pn/vitamin-c-facial-kit', badge: 'GLOW' },
            { text: 'Bridal Radiance Multi-Step Facial', url: '/cn/skin-care' },
            { text: 'Charcoal Deep Pore Detox Kit', url: '/cn/skin-care' }
          ]
        },
        {
          heading: 'Serums & Facial Prep',
          links: [
            { text: 'Hyaluronic Acid Hydrating Serum', url: '/cn/face' },
            { text: 'Niacinamide Pore Refining Elixir', url: '/cn/face' },
            { text: 'Thermal Soothing Rose Mist', url: '/cn/face' },
            { text: 'Gentle Cleansing Milks & Toners', url: '/cn/face' }
          ]
        },
        {
          heading: 'Masks & Treatments',
          links: [
            { text: 'Snail Mucin Collagen Sheet Masks', url: '/cn/skin-care' },
            { text: 'Peel-Off Gold Firming Mask', url: '/cn/skin-care' },
            { text: 'Deep Hydration Under Eye Patches', url: '/cn/skin-care' }
          ]
        }
      ],
      spotlight: {
        tag: 'TOP RATED',
        title: 'Vitamin C Brightening Facial Kit',
        price: '1,079',
        mrp: '1,399',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/1_fa5a3cf5-3cc3-4cf8-9cae-67349e9bb0c9.jpg?v=1795069704',
        url: '/pn/vitamin-c-facial-kit'
      },
      promo: {
        badge: 'STUDIO GLOW',
        title: 'Dermatologically Tested',
        desc: 'Active botanicals and clinical actives for radiant, glass skin results.',
        cta: 'Shop Skincare →',
        url: '/cn/skin-care'
      }
    },

    'make-up': {
      title: 'Makeup & Cosmetics',
      categoryUrl: '/cn/make-up',
      columns: [
        {
          heading: 'Velvet Lip Collection',
          links: [
            { text: 'Non-Transfer Waterproof Lip Gloss', url: '/pn/non-transfer-lip-gloss', badge: 'VIRAL' },
            { text: 'Amore Matte Long-Wear Lipstick', url: '/cn/make-up' },
            { text: 'Precision Lip Definer Liners', url: '/cn/make-up' },
            { text: 'Hydrating Peptide Lip Treatment', url: '/cn/make-up' }
          ]
        },
        {
          heading: 'Base & Face Artistry',
          links: [
            { text: 'Amore Matte Full Coverage Foundation', url: '/cn/make-up', badge: 'PRO' },
            { text: 'HD Highlighter Glow Palette', url: '/cn/make-up' },
            { text: 'Stainless Steel Mixing Palette', url: '/cn/make-up' },
            { text: 'All-Day Makeup Fixer Spray', url: '/cn/make-up' }
          ]
        },
        {
          heading: 'Eye Artistry & Lashes',
          links: [
            { text: 'Aqua Resist Waterproof Bold Kajal', url: '/cn/make-up' },
            { text: 'Liquid Glitter Sparkle Eyeshadow', url: '/cn/make-up' },
            { text: 'Lash Luxury Glue & Remover Set', url: '/cn/make-up' }
          ]
        }
      ],
      spotlight: {
        tag: 'FAN FAVORITE',
        title: 'Non-Transfer Lip Gloss (All Day)',
        price: '404',
        mrp: '449',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/1_8f60779d-24ae-4bc5-9a41-87133278dd33.jpg?v=1766489125',
        url: '/pn/non-transfer-lip-gloss'
      },
      promo: {
        badge: 'REFINED BEAUTY',
        title: 'Timeless Elegance Collection',
        desc: 'Weightless high-pigment formulas engineered for high-definition photography and bridal wear.',
        cta: 'Shop Makeup →',
        url: '/cn/make-up'
      }
    },

    'hair': {
      title: 'Hair Care & Studio Styling',
      categoryUrl: '/cn/hair',
      columns: [
        {
          heading: 'Salon Treatments',
          links: [
            { text: 'Keratin Deep Repair Hair Mask', url: '/cn/hair', badge: 'POPULAR' },
            { text: 'Argan Oil Anti-Frizz Serum', url: '/cn/hair' },
            { text: 'Intensive Scalp Tonic', url: '/cn/hair' }
          ]
        },
        {
          heading: 'Styling & Protection',
          links: [
            { text: 'Thermal Heat Protectant Spray', url: '/cn/hair', badge: 'MUST-HAVE' },
            { text: 'Extra Strong Hold Hair Lacquer', url: '/cn/hair' },
            { text: 'Volumizing Blowout Mousse', url: '/cn/hair' }
          ]
        },
        {
          heading: 'Pro Accessories',
          links: [
            { text: 'Sectioning Carbon Clips', url: '/cn/hair' },
            { text: 'Ceramic Round Blowout Brushes', url: '/cn/hair' }
          ]
        }
      ],
      spotlight: {
        tag: 'SALON ESSENTIAL',
        title: 'Hair Fibre Powder with Pump',
        price: '499',
        mrp: '699',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/Hair_Fiber_With_Pump_Black_1.jpg?v=1774593056',
        url: '/cn/hair'
      },
      promo: {
        badge: 'HEAT DEFENSE',
        title: 'Protection Up to 450°F',
        desc: 'Shield hair from thermal styling damage while adding brilliant mirror gloss.',
        cta: 'Shop Hair Care →',
        url: '/cn/hair'
      }
    },

    'best-selling': {
      title: 'Curated Best Sellers & Offers',
      categoryUrl: '/cn/best-selling',
      columns: [
        {
          heading: 'Top Rated Essentials',
          links: [
            { text: '9D Silk Cat Eye Gel Polish', url: '/pn/silk-9d-cat-eye-gel-polish-7-5ml', badge: '★ 4.9' },
            { text: 'Poly Gel Nail Extension Kit', url: '/pn/poly-gel-kit-spn-21096', badge: '★ 4.9' },
            { text: 'Solid Tip Bond Gel 15ml', url: '/pn/shills-solid-tip-bond-spn-21045' },
            { text: '12-in-1 Nail Therapy', url: '/pn/12-in-1-nail-therapy' }
          ]
        },
        {
          heading: 'Promotions & Combos',
          links: [
            { text: 'Black Friday Deals (Up to 25% OFF)', url: '/cn/best-selling', badge: 'SALE' },
            { text: 'Pro Starter Combos for Academies', url: '/cn/best-selling' },
            { text: 'Free Shipping on Orders ₹999+', url: '/cn/best-selling' }
          ]
        },
        {
          heading: 'Salon Guarantees',
          links: [
            { text: '100% Genuine Certified Stock', url: '/cn/best-selling' },
            { text: 'Bulk Salon Pricing Orders', url: '/cn/best-selling' },
            { text: '7-Day Replacement Guarantee', url: '/cn/best-selling' }
          ]
        }
      ],
      spotlight: {
        tag: '#1 BESTSELLER',
        title: 'Cat Eye Gel Polish Kit',
        price: '4,499',
        mrp: '5,999',
        image: 'https://cdn.shopify.com/s/files/1/0696/6476/8172/files/preview_images/190be95f8b55417ea0aa79af136773da.thumbnail.0000000000.jpg?v=1772784326',
        url: '/pn/cat-eye-gel-polish-kit'
      },
      promo: {
        badge: 'VIP BUNDLE',
        title: 'Mega Beauty Discounts',
        desc: 'Save more when you bundle professional UV lamps, top coats and gel polishes.',
        cta: 'View All Deals →',
        url: '/cn/best-selling'
      }
    }
  };

  function initMegaMenu() {
    const root = document.getElementById('shillsMegaMenuRoot');
    if (!root) return;

    let activeMenuId = null;
    let closeTimer = null;
    let openTimer = null;

    function renderMegaMenu(id) {
      const data = megaMenuData[id];
      if (!data) {
        closeMegaMenu();
        return;
      }

      root.innerHTML = `
        <div class="shills-mega-menu-panel">
          <div class="shills-mega-grid">
            ${data.columns.map(col => `
              <div class="shills-mega-col">
                <div class="shills-mega-heading">${esc(col.heading)}</div>
                <ul class="shills-mega-list">
                  ${col.links.map(link => `
                    <li>
                      <a href="${esc(link.url)}" data-spa-nav="${esc(link.url)}" class="shills-mega-link">
                        <span>${esc(link.text)}</span>
                        ${link.badge ? `<span class="shills-mega-tag ${link.badge.toLowerCase().includes('sale') || link.badge.includes('%') ? 'sale' : (link.badge.toLowerCase().includes('hot') ? 'hot' : '')}">${esc(link.badge)}</span>` : ''}
                      </a>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}

            ${data.spotlight ? `
              <div class="shills-mega-spotlight-card" data-spa-nav="${esc(data.spotlight.url)}">
                <div>
                  <div class="shills-spotlight-badge">★ ${esc(data.spotlight.tag)}</div>
                  <div class="shills-spotlight-img-wrap">
                    <img src="${esc(data.spotlight.image)}" alt="${esc(data.spotlight.title)}" loading="lazy" />
                  </div>
                  <div class="shills-spotlight-title" title="${esc(data.spotlight.title)}">${esc(data.spotlight.title)}</div>
                </div>
                <div class="shills-spotlight-footer">
                  <div>
                    <span class="shills-spotlight-price">₹${esc(data.spotlight.price)}</span>
                    ${data.spotlight.mrp ? `<span class="shills-spotlight-mrp">₹${esc(data.spotlight.mrp)}</span>` : ''}
                  </div>
                  <button type="button" class="shills-spotlight-btn">Shop Now</button>
                </div>
              </div>
            ` : ''}

            ${data.promo ? `
              <div class="shills-mega-promo-card" data-spa-nav="${esc(data.promo.url)}">
                <div>
                  <span class="shills-mega-promo-badge">${esc(data.promo.badge)}</span>
                  <div class="shills-mega-promo-title">${esc(data.promo.title)}</div>
                  <div class="shills-mega-promo-desc">${esc(data.promo.desc)}</div>
                </div>
                <button type="button" class="shills-mega-promo-btn">${esc(data.promo.cta)}</button>
              </div>
            ` : ''}
          </div>

          <div class="shills-mega-bottom-bar">
            <span>⚡ Salon Grade Formulations • 100% Genuine • Fast Express Dispatch</span>
            <a href="${esc(data.categoryUrl)}" data-spa-nav="${esc(data.categoryUrl)}" class="shills-mega-view-all-btn">
              View All ${esc(data.title)} (${state.products.filter(p => p.section === data.title || p.section.toLowerCase().includes(id.replace('-',' '))).length || '25+'}) →
            </a>
          </div>
        </div>
      `;

      root.classList.add('is-open');
    }

    function openMegaMenu(id) {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      activeMenuId = id;

      document.querySelectorAll('.__8pvtm').forEach(b => {
        b.classList.toggle('has-mega-open', b.getAttribute('data-mega-id') === id);
      });

      renderMegaMenu(id);
    }

    function closeMegaMenu() {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      activeMenuId = null;
      root.classList.remove('is-open');
      document.querySelectorAll('.__8pvtm').forEach(b => {
        b.classList.remove('has-mega-open');
      });
    }

    function queueClose() {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        closeMegaMenu();
      }, 160);
    }

    // Attach hover listeners to tab buttons
    document.querySelectorAll('.__8pvtm[data-mega-id]').forEach(btn => {
      const megaId = btn.getAttribute('data-mega-id');

      btn.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        if (activeMenuId && activeMenuId !== megaId) {
          openMegaMenu(megaId);
        } else {
          openTimer = setTimeout(() => {
            openMegaMenu(megaId);
          }, 80);
        }
      });

      btn.addEventListener('mouseleave', () => {
        clearTimeout(openTimer);
        queueClose();
      });

      // Clicking tab navigates to category & closes mega menu
      btn.addEventListener('click', () => {
        closeMegaMenu();
      });
    });

    // Keep mega menu open while hovering root panel
    root.addEventListener('mouseenter', () => {
      clearTimeout(closeTimer);
    });

    root.addEventListener('mouseleave', () => {
      queueClose();
    });

    // Close on any outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#shillsMegaMenuRoot') && !e.target.closest('.__8pvtm')) {
        closeMegaMenu();
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMegaMenu();
    });
  }


  function showHomeView() {
    if (state.spaContainer) {
      state.spaContainer.style.display = 'none';
      state.spaContainer.innerHTML = '';
    }
    if (state.homeContainer) {
      state.homeContainer.style.display = '';
      renderHomePage();
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

  // --- Full Single Product Page (PDP) ---
  function renderProductPage(prod) {
    if (!prod) return showHomeView();
    document.title = `${prod.name} - Buy Online at ₹${prod.price} | Shills Professional`;
    const discount = prod.mrp > prod.price ? Math.round(((prod.mrp - prod.price) / prod.mrp) * 100) : 0;
    const savings = Math.max(0, prod.mrp - prod.price);
    const imgs = (prod.images && prod.images.length > 0) ? prod.images : [prod.image];

    const variants = (prod.variants && prod.variants.length > 0)
      ? prod.variants
      : [{ label: prod.weight || '1 Unit', price: prod.price, mrp: prod.mrp }];

    let similar = state.products.filter(p => p.url !== prod.url && p.section === prod.section);
    if (similar.length < 5) {
      similar = similar.concat(state.products.filter(p => p.url !== prod.url && p.section !== prod.section)).slice(0, 10);
    } else {
      similar = similar.slice(0, 10);
    }

    const catObj = state.categories.find(c => c.name === prod.section);
    const catUrl = catObj ? catObj.url : `/cn/${prod.section.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    const html = `
      <nav class="zp-breadcrumb">
        <a href="/" data-spa-nav="/">Home</a>
        <span>›</span>
        <a href="${esc(catUrl)}" data-spa-nav="${esc(catUrl)}">${esc(prod.section)}</a>
        <span>›</span>
        <span style="color: #111827; font-weight: 600;">${esc(prod.name)}</span>
      </nav>

      <div class="zp-pdp-grid">
        <div class="zp-pdp-gallery">
          <div class="zp-pdp-img-box">
            ${discount > 0 ? `<span class="zp-discount-badge" style="top: 14px; left: 14px; font-size: 12px; padding: 4px 10px;">${discount}% OFF</span>` : ''}
            <button type="button" id="pdpShareBtn" title="Copy Product Link" style="position: absolute; top: 14px; right: 14px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 9999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">🔗</button>
            <img id="pdpMainImg" src="${esc(imgs[0])}" alt="${esc(prod.name)}" />
          </div>

          <div class="zp-pdp-thumbs">
            ${imgs.map((src, i) => `
              <button type="button" class="zp-pdp-thumb ${i === 0 ? 'active' : ''}" data-thumb-src="${esc(src)}">
                <img src="${esc(src)}" alt="View ${i + 1}" />
              </button>
            `).join('')}
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 1rem;">
            <div style="background: #f9fafb; border: 1px solid #ece9f2; border-radius: 0.5rem; padding: 0.65rem; text-align: center; font-size: 0.75rem; color: #374151; font-weight: 600;">⚡ 10 Min Delivery</div>
            <div style="background: #f9fafb; border: 1px solid #ece9f2; border-radius: 0.5rem; padding: 0.65rem; text-align: center; font-size: 0.75rem; color: #374151; font-weight: 600;">✓ 100% Authentic</div>
            <div style="background: #f9fafb; border: 1px solid #ece9f2; border-radius: 0.5rem; padding: 0.65rem; text-align: center; font-size: 0.75rem; color: #374151; font-weight: 600;">↺ Salon Grade</div>
          </div>
        </div>

        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <a href="${esc(catUrl)}" data-spa-nav="${esc(catUrl)}" style="display: inline-block; font-size: 0.8rem; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none;">${esc(prod.brand)} ›</a>
            <span class="shills-pro-badge" style="margin: 0; font-size: 11px; padding: 4px 10px;">★ CERTIFIED SALON GRADE</span>
          </div>

          <h1 style="font-size: 1.5rem; font-weight: 800; color: #111827; margin: 0 0 10px 0; line-height: 1.3;">${esc(prod.name)}</h1>

          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
            <span style="background: #ecfdf5; color: #059669; font-weight: 700; font-size: 0.85rem; padding: 3px 10px; border-radius: 6px;">★ ${prod.rating}</span>
            <span style="font-size: 0.85rem; color: #6b7280;">(${Number(prod.reviews).toLocaleString()} verified ratings)</span>
          </div>

          <p style="font-size: 0.78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; margin: 0 0 8px 0;">Select Option / Variant</p>
          <div class="zp-variant-row">
            ${variants.map((v, idx) => `
              <button type="button" class="zp-variant-pill ${idx === 0 ? 'active' : ''}" data-v-price="${v.price}" data-v-mrp="${v.mrp}">
                <div style="font-size: 0.82rem; font-weight: 700; color: #111827;">${esc(v.label)}</div>
                <div style="font-size: 0.78rem; color: #4b5563; margin-top: 2px;">
                  <strong>₹${v.price}</strong>
                  ${v.mrp > v.price ? `<span style="text-decoration: line-through; color: #9ca3af; margin-left: 4px;">₹${v.mrp}</span>` : ''}
                </div>
              </button>
            `).join('')}
          </div>

          <div style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 1rem 0; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: baseline; gap: 10px;">
              <span id="pdpPriceDisplay" style="font-size: 1.9rem; font-weight: 800; color: #111827;">₹${prod.price}</span>
              <span id="pdpMrpDisplay" style="font-size: 1rem; color: #9ca3af; text-decoration: line-through; ${prod.mrp > prod.price ? '' : 'display:none;'}">MRP ₹${prod.mrp}</span>
              ${savings > 0 ? `<span style="background: #dcfce7; color: #15803d; font-weight: 700; font-size: 0.8rem; padding: 2px 8px; border-radius: 4px;">Save ₹${savings} (${discount}% OFF)</span>` : ''}
            </div>
            <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: #6b7280;">(Inclusive of all taxes)</p>
          </div>

          <div style="display: flex; gap: 12px; margin-bottom: 1.25rem;">
            <div class="zp-cta-slot" data-slot-url="${esc(prod.url)}" data-full="1" style="flex: 1; display: flex;">
              ${renderCtaControl(prod, true)}
            </div>
            <button type="button" id="pdpOpenCartBtn" style="background: #f5f0ff; color: #3c006b; border: 1px solid #ddd6fe; padding: 0.85rem 1.25rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">
              View Cart
            </button>
          </div>

          <div class="zp-offers-box">
            <div style="font-size: 0.82rem; font-weight: 700; color: #4c1d95; margin-bottom: 4px;">🏷️ Shills Pro Offers</div>
            <div style="font-size: 0.78rem; color: #5b21b6;">• Use code <strong>SHILLS10</strong> for flat 10% instant discount on orders above ₹999</div>
            <div style="font-size: 0.78rem; color: #5b21b6; margin-top: 2px;">• Free express delivery unlocked on orders above ₹499</div>
          </div>

          <div style="background: #faf9fc; border: 1px solid #ece9f2; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1rem;">
            <h3 style="margin: 0 0 0.65rem 0; font-size: 0.9rem; font-weight: 700; color: #111827;">Why shop Shills Professional?</h3>
            <div style="display: flex; flex-direction: column; gap: 0.55rem; font-size: 0.82rem; color: #4b5563;">
              <div><strong>💅 Salon-Grade Formulas:</strong> Trusted by professional nail artists and beauty salons across India.</div>
              <div><strong>⚡ Superfast Delivery:</strong> Dispatched immediately to arrive at your doorstep or studio fast.</div>
              <div><strong>✓ 100% Genuine:</strong> Direct from Shills Professional official inventory.</div>
            </div>
          </div>

          <details class="zp-accordion" open>
            <summary>Product Information <span>▾</span></summary>
            <p style="margin: 0.65rem 0 0.75rem 0; font-size: 0.85rem; color: #4b5563; line-height: 1.5;">${esc(prod.desc)}</p>
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; font-size: 0.82rem; padding-top: 0.5rem;">
              <span style="color: #6b7280;">Brand</span><span style="font-weight: 600; color: #111827;">${esc(prod.brand)}</span>
              <span style="color: #6b7280;">Option</span><span style="font-weight: 600; color: #111827;">${esc(prod.weight)}</span>
              <span style="color: #6b7280;">Category</span><span style="font-weight: 600; color: #111827;">${esc(prod.section)}</span>
            </div>
          </details>
        </div>
      </div>

      <div class="zp-pdp-mobile-bar">
        <div>
          <div style="font-size: 1.05rem; font-weight: 800; color: #111827;">₹${prod.price}</div>
          <div style="font-size: 0.72rem; color: #6b7280;">${esc(prod.weight)}</div>
        </div>
        <div class="zp-cta-slot" data-slot-url="${esc(prod.url)}" data-full="1" style="flex: 1; display: flex; max-width: 220px;">
          ${renderCtaControl(prod, true)}
        </div>
      </div>

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

    const shareBtn = document.getElementById('pdpShareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (navigator.clipboard) navigator.clipboard.writeText(window.location.href).catch(() => {});
        showToast('Product link copied!');
      });
    }

    const mainImg = document.getElementById('pdpMainImg');
    document.querySelectorAll('.zp-pdp-thumb').forEach(th => {
      th.addEventListener('click', () => {
        document.querySelectorAll('.zp-pdp-thumb').forEach(t => t.classList.remove('active'));
        th.classList.add('active');
        if (mainImg && th.dataset.thumbSrc) mainImg.src = th.dataset.thumbSrc;
      });
    });

    document.querySelectorAll('.zp-variant-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.zp-variant-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const vp = document.getElementById('pdpPriceDisplay');
        const vm = document.getElementById('pdpMrpDisplay');
        if (vp) vp.textContent = `₹${pill.dataset.vPrice}`;
        if (vm) {
          if (Number(pill.dataset.vMrp) > Number(pill.dataset.vPrice)) {
            vm.style.display = '';
            vm.textContent = `MRP ₹${pill.dataset.vMrp}`;
          } else {
            vm.style.display = 'none';
          }
        }
      });
    });
  }

  // --- Full Category / Listing Page (PLP) ---
  function renderCategoryPage(catHandle, activePath) {
    const catObj = state.categories.find(c => c.handle === catHandle || c.url === activePath);
    const title = catObj ? catObj.name : catHandle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    document.title = `${title} | Shills Professional`;

    let matched = state.products.filter(p => p.section.toLowerCase() === title.toLowerCase());
    if (matched.length === 0) {
      const terms = catHandle.split('-').filter(t => t.length > 2);
      matched = state.products.filter(p => terms.some(t => `${p.name} ${p.section} ${p.desc}`.toLowerCase().includes(t)));
    }
    if (matched.length === 0) matched = [...state.products];

    if (state.activeSort === 'price-asc') matched.sort((a, b) => a.price - b.price);
    else if (state.activeSort === 'price-desc') matched.sort((a, b) => b.price - a.price);
    else if (state.activeSort === 'rating') matched.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const html = `
      <nav class="zp-breadcrumb">
        <a href="/" data-spa-nav="/">Home</a>
        <span>›</span>
        <span style="color: #111827; font-weight: 600;">${esc(title)}</span>
      </nav>

      <div class="zp-plp-layout">
        <aside class="zp-plp-sidebar">
          <div style="padding: 0.5rem 0.75rem; font-size: 0.75rem; font-weight: 700; color: #9ca3af; text-transform: uppercase;">Categories</div>
          ${state.categories.map(item => {
            const isAct = item.name.toLowerCase() === title.toLowerCase();
            return `<div class="zp-sidebar-item ${isAct ? 'active' : ''}" data-spa-nav="${esc(item.url)}">${esc(item.name)}</div>`;
          }).join('')}
        </aside>

        <div>
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 1rem; background: #ffffff; padding: 1rem 1.25rem; border-radius: 0.75rem; border: 1px solid #ece9f2;">
            <div>
              <h1 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #111827;">${esc(title)}</h1>
              <p style="margin: 2px 0 0 0; font-size: 0.82rem; color: #6b7280;">Showing ${matched.length} Shills Professional products</p>
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
    setActiveMenuTab(title);

    const sortEl = document.getElementById('zpSortSelect');
    if (sortEl) {
      sortEl.addEventListener('change', (e) => {
        state.activeSort = e.target.value;
        renderCategoryPage(catHandle, activePath);
      });
    }
  }

  // --- Full Search Page ---
  function renderSearchPage(initialQuery) {
    document.title = 'Search Shills Professional Products';
    const q = (initialQuery || '').trim();
    const matched = q
      ? state.products.filter(p => `${p.name} ${p.brand} ${p.section} ${p.desc}`.toLowerCase().includes(q.toLowerCase()))
      : state.products.slice(0, 20);

    const html = `
      <div style="background: #ffffff; border: 1px solid #ece9f2; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 10px; border: 2px solid #7c3aed; border-radius: 0.65rem; padding: 0.65rem 1rem;">
          <span style="font-size: 1.15rem;">🔍</span>
          <input id="zpPageSearchInput" type="text" value="${esc(q)}" placeholder="Search for gel polish, cat eye, nail lamp, primer, skincare..." style="flex: 1; border: none; outline: none; font-size: 1rem; color: #111827;" />
          ${q ? `<button type="button" id="zpClearSearch" style="background: none; border: none; color: #6b7280; cursor: pointer; font-size: 1.1rem;">✕</button>` : ''}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0.85rem; align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #6b7280;">TRENDING:</span>
          ${['Gel Polish', 'Cat Eye', 'Nail Lamp', 'Nail Tips', 'Brush', 'Top Coat', 'Serum', 'Lipstick'].map(tag => `
            <button type="button" class="zp-search-chip" data-q="${tag}" style="background: #f3f4f6; border: none; padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer;">${tag}</button>
          `).join('')}
        </div>
      </div>

      <h2 style="font-size: 1.1rem; font-weight: 700; color: #111827; margin: 0 0 1rem 0;">
        ${q ? `Search results for "${esc(q)}" (${matched.length})` : 'Popular Shills Professional Products'}
      </h2>

      ${matched.length === 0 ? `
        <div style="text-align: center; padding: 3rem; background: #ffffff; border-radius: 0.75rem; border: 1px solid #ece9f2;">
          <p style="font-size: 1.1rem; font-weight: 600; color: #374151;">No products matched "${esc(q)}"</p>
          <p style="color: #6b7280; font-size: 0.9rem;">Try searching for Gel Polish, Cat Eye, Lamp, Tips, or Serum.</p>
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

    const parts = path.split('/').filter(Boolean);
    const handle = parts[1] || parts[0] || 'best-selling';
    renderCategoryPage(handle, path);
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
            <p style="font-size: 0.85rem; color: #6b7280; margin: 2px 0 0 0;">${count} ${count === 1 ? 'item' : 'items'} • Shills Professional</p>
          </div>
          <button type="button" id="closeCartBtn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 4px;">✕</button>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 1.25rem;">
          ${items.length === 0 ? `
            <div style="text-align: center; padding: 3rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">💅</div>
              <h3 style="font-size: 1.1rem; font-weight: 600; color: #374151;">Your cart is empty</h3>
              <p style="color: #6b7280; font-size: 0.9rem; margin-top: 0.5rem;">Add salon-grade gel polishes, nail art &amp; beauty essentials!</p>
              <button type="button" id="cartShopNow" style="margin-top: 1.5rem; background: #111111; color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">Shop Now</button>
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
                <span>Express Delivery</span>
                <span style="color: #10b981; font-weight: 600;">FREE</span>
              </div>
              <div style="border-top: 1px dashed #d1d5db; padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; color: #111827;">
                <span>To Pay</span>
                <span>₹${total}</span>
              </div>
            </div>
          `}
        </div>

        ${items.length > 0 ? `
          <div style="padding: 1.25rem; border-top: 1px solid #e5e7eb; background: #ffffff;">
            <button type="button" id="checkoutBtn" style="width: 100%; background: #111111; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
              <span>₹${total} • Proceed to Checkout</span>
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
          syncInlineCartButtons(id);
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
          syncInlineCartButtons(id);
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
            <button type="button" id="saveCustomLocBtn" style="background: #111111; color: white; border: none; padding: 0 1rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer;">Save</button>
          </div>
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
      localStorage.setItem('shills_location', loc);
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
          <div style="width: 56px; height: 56px; background: #ffe4e9; color: #3c006b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin: 0 auto 1rem auto;">💅</div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0;">Shills Professional</h2>
          <p style="font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0;">Log in or Sign up for salon pro offers and order tracking</p>
          <div style="display: flex; border: 1px solid #d1d5db; border-radius: 0.5rem; overflow: hidden; margin-bottom: 1rem;">
            <span style="background: #f9fafb; padding: 0.75rem 0.85rem; font-weight: 600; font-size: 0.95rem; color: #374151; border-right: 1px solid #d1d5db;">+91</span>
            <input id="loginPhoneInput" type="tel" maxlength="10" placeholder="Enter Phone Number" style="flex: 1; border: none; outline: none; padding: 0.75rem; font-size: 0.95rem;" />
          </div>
          <button type="button" id="sendOtpBtn" style="width: 100%; background: #111111; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer;">Continue with Phone</button>
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
        state.user = { phone, name: 'Shills Pro Member' };
        localStorage.setItem('shills_user', JSON.stringify(state.user));
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

    const total = getCartTotal();

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
              <p style="margin: 0; font-size: 0.85rem; font-weight: 700; color: #065f46;">Express Delivery</p>
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
          <p style="font-size: 0.95rem; color: #4b5563; margin: 0 0 1.5rem 0;">Your Shills Professional order is being packed for delivery to ${esc(state.location.split(',')[0])}.</p>
          <button type="button" id="successOkBtn" style="background: #111111; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">Awesome, Thanks!</button>
        </div>
      `;
      document.body.appendChild(successModal);
      successModal.querySelector('#successOkBtn').addEventListener('click', () => successModal.remove());
    });
  }

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

  function bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.zp-add-btn[data-add-url]');
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        const url = addBtn.dataset.addUrl;
        const prod = findProductByUrl(url);
        addToCart(prod, 1);
        showToast(`Added ${prod ? prod.name.slice(0, 26) : 'item'} to cart`);
        syncInlineCartButtons(url);
        return;
      }

      const incBtn = e.target.closest('.zp-qty-inc[data-url]');
      if (incBtn) {
        e.preventDefault();
        e.stopPropagation();
        const url = incBtn.dataset.url;
        const prod = findProductByUrl(url);
        addToCart(prod, 1);
        syncInlineCartButtons(url);
        return;
      }

      const decBtn = e.target.closest('.zp-qty-dec[data-url]');
      if (decBtn) {
        e.preventDefault();
        e.stopPropagation();
        const url = decBtn.dataset.url;
        const prod = findProductByUrl(url);
        addToCart(prod, -1);
        syncInlineCartButtons(url);
        return;
      }

      const spaCard = e.target.closest('.zp-card[data-prod-url]');
      if (spaCard) {
        e.preventDefault();
        navigateTo(spaCard.dataset.prodUrl);
        return;
      }

      const spaNav = e.target.closest('[data-spa-nav]');
      if (spaNav) {
        e.preventDefault();
        navigateTo(spaNav.dataset.spaNav);
        return;
      }

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

      const menuTab = e.target.closest('button.__8pvtm');
      if (menuTab) {
        e.preventDefault();
        const href = menuTab.dataset.tabHref || '/';
        navigateTo(href);
        return;
      }

      const anchor = e.target.closest('a[href]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        if (href.startsWith('http') && !href.includes('zepto.com') && !href.includes('shillsprofessional.com')) return;
        e.preventDefault();
        navigateTo(href);
      }
    });

    window.addEventListener('popstate', handleRoute);
  }

  window.addEventListener('DOMContentLoaded', async () => {
    ensureContainers();
    await loadCatalog();
    updateLocationUI();
    updateUserUI();
    updateCartUI();
    bindGlobalEvents();
    initMegaMenu();
    handleRoute();
  });
})();
