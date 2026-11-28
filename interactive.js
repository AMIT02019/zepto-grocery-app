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
        if (span) span.style.color = '#9A16CA';
        if (bar) { bar.style.opacity = '1'; bar.style.backgroundColor = '#9A16CA'; }
      } else {
        btn.classList.remove('zp-tab-active');
        if (span) span.style.color = '#586274';
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
      <button type="button" class="zp-add-btn" data-add-url="${esc(prod.url)}" ${fullWidth ? 'style="flex: 1; background: #ff3269; color: white; padding: 0.85rem 1.5rem; font-size: 1rem; border-radius: 0.5rem;"' : ''}>
        ${fullWidth ? `Add to Cart • ₹${prod.price}` : 'ADD'}
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
          <div class="zp-eta-badge">⚡ 10 MINS</div>
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
      },
      {
        img: 'https://shillsprofessional.com/cdn/shop/files/Black_Friday_Sale_Banner.jpg?v=1795714618&width=2400',
        title: 'Shills Mega Beauty Sale',
        sub: 'Up to 40% OFF on Top Coats, Primers, Skincare & Makeup',
        cta: 'Shop Deals',
        url: '/cn/best-selling'
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
          <a href="/cn/best-selling" data-spa-nav="/cn/best-selling" style="color: #ff3269; font-weight: 700; font-size: 0.875rem; text-decoration: none;">See All ›</a>
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

    // Featured Product Carousels
    const featuredSections = ['Gel Polish', 'Nail Art', 'UV/LED Nail Lamps', 'Nail Extensions', 'Skincare', 'Makeup'];
    const sectionsHtml = featuredSections.map(secName => {
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
            <a href="${esc(secUrl)}" data-spa-nav="${esc(secUrl)}" style="color: #ff3269; font-weight: 700; font-size: 0.875rem; text-decoration: none;">View All (${state.products.filter(p => p.section === secName).length}) ›</a>
          </div>
          <div class="zp-prod-grid">
            ${items.map(renderProductCard).join('')}
          </div>
        </section>
      `;
    }).join('');

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
            <button type="button" data-spa-nav="/cn/cat-eye-kit" style="background: #ff3269; color: white; border: none; padding: 0.75rem 1.4rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(255,50,105,0.3);">Shop Featured Kit →</button>
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
        ${sectionsHtml}
        ${videoSectionHtml}
        ${reviewsHtml}
        ${faqSectionHtml}
        ${partnersHtml}
      </div>
    `;

    // Initialize Banner Carousel
    initBannerSlider(banners.length);
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
            <span class="zp-eta-badge" style="margin: 0; font-size: 11px; padding: 3px 8px;">⚡ Delivery in 10 mins</span>
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
            <button type="button" id="checkoutBtn" style="width: 100%; background: #ff3269; color: white; border: none; padding: 0.85rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
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
            <button type="button" id="saveCustomLocBtn" style="background: #ff3269; color: white; border: none; padding: 0 1rem; border-radius: 0.375rem; font-weight: 600; cursor: pointer;">Save</button>
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
          <div style="width: 56px; height: 56px; background: #ffe4e9; color: #ff3269; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin: 0 auto 1rem auto;">💅</div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem 0;">Shills Professional</h2>
          <p style="font-size: 0.85rem; color: #6b7280; margin: 0 0 1.5rem 0;">Log in or Sign up for salon pro offers and order tracking</p>
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
          <button type="button" id="successOkBtn" style="background: #ff3269; color: white; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-weight: 700; cursor: pointer;">Awesome, Thanks!</button>
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
    handleRoute();
  });
})();
