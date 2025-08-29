
(() => {
  const $ = (sel, el=document) => el.querySelector(sel);
  const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth scroll for [data-scroll]
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-scroll]");
    if (!a) return;
    const href = a.getAttribute("href") || a.dataset.scroll;
    if (href && href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
      // close overlays for mobile
      closeMenu();
      closeSearch();
    }
  });

  // Mobile menu
  const navBtn = $(".nav-button");
  const navbar = $("#navbar");
  const overlay = $(".navbar-overlay");
  const closeBtn = $(".navbar .close");

  function openMenu(){
    if (!navbar) return;
    navbar.hidden = false;
    if (overlay) overlay.hidden = false;
    navBtn && navBtn.setAttribute("aria-expanded","true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu(){
    if (!navbar) return;
    navbar.hidden = true;
    if (overlay) overlay.hidden = true;
    navBtn && navBtn.setAttribute("aria-expanded","false");
    document.body.style.overflow = "";
  }

  navBtn && navBtn.addEventListener("click", openMenu);
  closeBtn && closeBtn.addEventListener("click", closeMenu);
  overlay && overlay.addEventListener("click", closeMenu);

  // Close menu when clicking nav links inside overlay
  const navLinks = $$(".main-navigation a");
  navLinks.forEach(l => l.addEventListener("click", () => closeMenu()));

  // Search overlay (client-side simple search)
  const searchToggle = $(".search-toggle");
  const searchWrap = $(".header-search");
  const searchClose = $(".header-search .close-icon");
  const doSearchBtn = $(".header-search .do-search");
  const q = $("#q");
  function openSearch(){ if (searchWrap){ searchWrap.hidden = false; setTimeout(()=> q && q.focus(),30); } }
  function closeSearch(){ if (searchWrap){ searchWrap.hidden = true; q.value=""; } }
  searchToggle && searchToggle.addEventListener("click", openSearch);
  searchClose && searchClose.addEventListener("click", closeSearch);
  doSearchBtn && doSearchBtn.addEventListener("click", () => {
    const term = (q && q.value || "").trim().toLowerCase();
    if (!term) {
      // brief shake to indicate need input
      if (q){ q.classList.add('shake'); setTimeout(()=>q.classList.remove('shake'),400); }
      return;
    }
    // Simple highlight demo: find first matching section and scroll to it
    const hit = $$(".section").find(s => s.textContent.toLowerCase().includes(term));
    if (hit) { hit.scrollIntoView({behavior:"smooth"}); closeSearch(); }
    else {
      // small feedback
      if (q) { q.classList.add('not-found'); setTimeout(()=> q.classList.remove('not-found'),700); }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeMenu(); closeSearch(); closeLightbox(); }
  });

  // Portfolio filters + no-results handling
  const grid = $("#workGrid");
  const buttons = $$(".filters .filter");
  const noResultsEl = document.createElement("div");
  noResultsEl.className = "no-results";
  noResultsEl.textContent = "No projects match that filter.";

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;
      let anyVisible = false;
      $$(".work-item", grid).forEach(item => {
        const on = filter === "*" || item.dataset.cat === filter;
        item.style.display = on ? "" : "none";
        if (on) anyVisible = true;
      });
      // toggle no-results message
      if (!anyVisible) {
        if (!grid.contains(noResultsEl)) grid.appendChild(noResultsEl);
      } else {
        if (grid.contains(noResultsEl)) grid.removeChild(noResultsEl);
      }
    });
  });

  // Lightbox with keyboard nav
  const lb = $(".lightbox");
  const lbImg = $(".lightbox img");
  const lbClose = $(".lightbox-close");
  let currentIndex = -1;
  const items = $$(".work-item");
  function openLightboxByIndex(i){
    if (!items[i]) return;
    const src = items[i].getAttribute("href");
    currentIndex = i;
    lb.hidden = false;
    lbImg.src = src;
    lbImg.alt = items[i].querySelector("figcaption")?.textContent || "Preview";
    lb.setAttribute("aria-hidden","false");
    // trap focus briefly
    lbClose && lbClose.focus();
  }
  function openLightbox(src){
    const idx = items.findIndex(it => it.getAttribute("href") === src);
    openLightboxByIndex(idx >= 0 ? idx : 0);
  }
  function closeLightbox(){ if (!lb) return; lb.hidden = true; lbImg.src = ""; lb.setAttribute("aria-hidden","true"); currentIndex = -1; }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-lightbox]");
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute("href");
    const idx = items.findIndex(it => it === a);
    openLightboxByIndex(idx >= 0 ? idx : 0);
  });
  lbClose && lbClose.addEventListener("click", closeLightbox);
  lb && lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (lb && !lb.hidden) {
      if (e.key === "ArrowLeft") openLightboxByIndex(Math.max(0, currentIndex-1));
      if (e.key === "ArrowRight") openLightboxByIndex(Math.min(items.length-1, currentIndex+1));
    }
  });

  // Counters on view
  const counters = $$(".counter");
  if ('IntersectionObserver' in window && counters.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const end = parseInt(el.dataset.count,10) || 0;
        let cur = 0;
        const step = Math.max(1, Math.ceil(end / 60));
        const t = setInterval(() => {
          cur += step;
          if (cur >= end) { cur = end; clearInterval(t); }
          el.textContent = cur;
        }, 18);
        io.unobserve(el);
      });
    }, {threshold: .5});
    counters.forEach(c => io.observe(c));
  } else {
    counters.forEach(c => c.textContent = c.dataset.count || "0");
  }

  // Slider (testimonials)
  const slider = $(".slider");
  if (slider) {
    const slidesWrap = $(".slides", slider);
    const slides = $$(".slide", slidesWrap);
    const prev = $(".prev", slider);
    const next = $(".next", slider);
    const dots = $(".dots", slider);
    let index = 0;
    function go(i){
      index = (i + slides.length) % slides.length;
      slidesWrap.style.transform = `translateX(-${index * 100}%)`;
      Array.from(dots.children).forEach((d, k) => d.setAttribute("aria-selected", k===index ? "true" : "false"));
    }
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type="button"; b.setAttribute("role","tab"); b.setAttribute("aria-selected","false");
      b.addEventListener("click", () => go(i));
      dots.appendChild(b);
    });
    prev && prev.addEventListener("click", () => go(index - 1));
    next && next.addEventListener("click", () => go(index + 1));
    go(0);
    let auto = setInterval(() => go(index+1), 5000);
    slider.addEventListener("mouseenter", () => clearInterval(auto));
    slider.addEventListener("mouseleave", () => auto = setInterval(() => go(index+1), 5000));
  }

  // Contact form validation + simulated send
  const form = $(".contact-form");
  const formMsg = $(".form-msg");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get("name") || "").trim();
      const email = (fd.get("email") || "").trim();
      const message = (fd.get("message") || "").trim();
      // Basic validation
      if (!name) { formMsg.textContent = "Please enter your name."; return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { formMsg.textContent = "Please enter a valid email."; return; }
      if (!message) { formMsg.textContent = "Please enter a message."; return; }
      // Simulate send
      formMsg.textContent = "Sending…";
      const submitBtn = form.querySelector("button[type=submit]");
      if (submitBtn) submitBtn.disabled = true;
      setTimeout(() => {
        formMsg.textContent = "Message sent — thank you! I'll reply soon.";
        form.reset();
        if (submitBtn) submitBtn.disabled = false;
      }, 900);
    });
  }

  // Back to top
  const toTop = $(".to-top");
  toTop && toTop.addEventListener("click", () => window.scrollTo({top:0,behavior:"smooth"}));

  // Simple accessibility / small fixes
  // Ensure images have alt attributes (skip if already present)
  $$("img").forEach(i => { if (!i.hasAttribute("alt")) i.setAttribute("alt",""); });

})();
