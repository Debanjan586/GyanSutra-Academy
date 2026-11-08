(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('menuToggle');
  const dropItems = [...document.querySelectorAll('.has-drop')];
  const navLinks = [...document.querySelectorAll('a.nav-link')];

  /* ---------- Header shadow on scroll ---------- */
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    nav.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) closeDrops();
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));

  /* ---------- Dropdowns (click / tap, plus hover via CSS on desktop) ---------- */
  function closeDrops(except) {
    dropItems.forEach(li => {
      if (li === except) return;
      li.classList.remove('open');
      li.querySelector('.drop-btn').setAttribute('aria-expanded', 'false');
    });
  }

  dropItems.forEach(li => {
    const btn = li.querySelector('.drop-btn');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const willOpen = !li.classList.contains('open');
      closeDrops(li);
      li.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.has-drop')) closeDrops();
    if (nav.classList.contains('open') && !e.target.closest('.nav') && !e.target.closest('#menuToggle')) setMenu(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeDrops(); setMenu(false); }
  });

  // Close the menu after choosing any link inside it
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { closeDrops(); setMenu(false); }));

  // Reset mobile state when resizing up to desktop
  window.addEventListener('resize', () => { if (window.innerWidth > 1024) setMenu(false); });

  /* ---------- Active link while scrolling ---------- */
  const targets = navLinks
    .map(l => ({ link: l, el: document.querySelector(l.getAttribute('href')) }))
    .filter(t => t.el);

  if ('IntersectionObserver' in window && targets.length) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(t => spy.observe(t.el));
  }

  /* ---------- Search button (hook up later) ---------- */
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) searchBtn.addEventListener('click', () => {
    // TODO: open a search overlay / go to a search page
  });
})();