/* ============================================================
   GyanSutra Academy — Course detail page logic
   course.html?slug=<slug>
   ============================================================ */

(function () {
  'use strict';

  const API_BASE = 'https://gyansutra-academy.onrender.com';

  /* ── DOM ── */
  const cdLoading    = document.getElementById('cdLoading');
  const cdError      = document.getElementById('cdError');
  const cdContent    = document.getElementById('cdContent');
  const cdBreadTitle = document.getElementById('cdBreadTitle');
  const cdThumbWrap  = document.getElementById('cdThumbWrap');
  const cdTags       = document.getElementById('cdTags');
  const cdTitle      = document.getElementById('cdTitle');
  const cdShort      = document.getElementById('cdShort');
  const cdDesc       = document.getElementById('cdDesc');
  const cdPrice      = document.getElementById('cdPrice');
  const cdInfoRows   = document.getElementById('cdInfoRows');

  /* ── Read slug from URL ── */
  const slug = new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    showError();
  } else {
    loadCourse(slug);
  }

  async function loadCourse(slug) {
    try {
      /* Try single-course endpoint first, fall back to list */
      let course = null;
      const r = await fetch(`${API_BASE}/api/courses/${slug}`);
      if (r.ok) {
        const d = await r.json();
        course = d.course || d;
      } else {
        /* Fall back: fetch all, find by slug */
        const r2   = await fetch(`${API_BASE}/api/courses`);
        const data = await r2.json();
        const list = Array.isArray(data) ? data : (data.courses || data.data || []);
        course = list.find(c => c.slug === slug);
      }

      if (!course) { showError(); return; }

      /* Update <title> and meta */
      document.title = `${course.title} — GyanSutra Academy`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.content = course.shortDescription || course.title;

      render(course);
    } catch (_) {
      showError();
    }
  }

  function render(c) {
    /* Breadcrumb */
    cdBreadTitle.textContent = c.title;

    /* Thumbnail */
    if (c.image) {
      cdThumbWrap.innerHTML =
        `<img class="cd-thumb" src="${esc(c.image)}" alt="${esc(c.title)}">`;
    } else {
      cdThumbWrap.innerHTML =
        `<div class="cd-thumb-placeholder">
           <svg viewBox="0 0 24 24" width="48" height="48" fill="none"
             stroke="currentColor" stroke-width="1.4"
             stroke-linecap="round" stroke-linejoin="round">
             <rect x="3" y="3" width="18" height="18" rx="3"/>
             <path d="M3 9h18M9 21V9"/>
           </svg>
         </div>`;
    }

    /* Tags */
    let tagsHTML = '';
    if (c.category) tagsHTML += `<span class="cd-tag tag-cat">${esc(c.category)}</span>`;
    if (c.level)    tagsHTML += `<span class="cd-tag">${esc(c.level)}</span>`;
    cdTags.innerHTML = tagsHTML;

    /* Title */
    cdTitle.textContent = c.title;

    /* Short description */
    if (c.shortDescription) {
      cdShort.textContent = c.shortDescription;
    } else {
      cdShort.style.display = 'none';
    }

    /* Full description */
    if (c.description) {
      /* Preserve line breaks */
      cdDesc.innerHTML = esc(c.description).replace(/\n/g, '<br>');
    } else {
      cdDesc.closest('.cd-desc-label') && (cdDesc.previousElementSibling.style.display = 'none');
      cdDesc.style.display = 'none';
    }

    /* Price */
    const hasOffer = c.offerPrice &&
      parseFloat(c.offerPrice) < parseFloat(c.regularPrice);
    if (hasOffer) {
      cdPrice.innerHTML =
        `<span class="cd-offer-price">₹${fmt(c.offerPrice)}</span>
         <span class="cd-reg-price">₹${fmt(c.regularPrice)}</span>
         <span class="cd-offer-label">Special Offer</span>`;
    } else if (c.regularPrice) {
      cdPrice.innerHTML =
        `<span class="cd-offer-price">₹${fmt(c.regularPrice)}</span>`;
    } else {
      cdPrice.innerHTML = `<span class="cd-offer-price">Free</span>`;
    }

    /* Info rows */
    let rows = '';
    if (c.duration) rows += infoRow(clockIcon(), 'Duration', c.duration);
    if (c.level)    rows += infoRow(levelIcon(), 'Level', c.level);
    if (c.category) rows += infoRow(tagIcon(), 'Category', c.category);
    cdInfoRows.innerHTML = rows;

    /* Show content */
    cdLoading.classList.add('hidden');
    cdContent.classList.remove('hidden');
  }

  function showError() {
    cdLoading.classList.add('hidden');
    cdError.classList.remove('hidden');
  }

  /* ── Info row helpers ── */
  function infoRow(icon, label, value) {
    return `<div class="cd-info-row">
      <span class="cd-info-icon">${icon}</span>
      <div>
        <span class="cd-info-label">${label}</span>
        <span class="cd-info-val">${esc(value)}</span>
      </div>
    </div>`;
  }

  function clockIcon() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
  }
  function levelIcon() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20M6 20V10M12 20V4M18 20v-6"/></svg>`;
  }
  function tagIcon() {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/></svg>`;
  }

  /* ── Utils ── */
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmt(n) {
    const x = parseFloat(n);
    return isNaN(x) ? n : x.toLocaleString('en-IN');
  }

})();