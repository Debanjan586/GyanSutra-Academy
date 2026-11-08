/* ============================================================
   GyanSutra Academy — Courses section logic
   ============================================================ */

(function () {
  "use strict";

  const API_BASE = "https://gyansutra-academy.onrender.com";
  const ENDPOINT = API_BASE + "/api/courses";

  const GROUPS_LIMIT = 4; // max groups before "Show More Groups"

  /* ---------- Breakpoint helpers ---------- */
  function getLimit() {
    const w = window.innerWidth;
    if (w <= 530) return 4;
    if (w <= 799) return 6;
    if (w <= 1243) return 9;
    return 8;
  }
  function getSkeletonCount() {
    const w = window.innerWidth;
    if (w <= 799) return 2;
    if (w <= 1243) return 3;
    return 4;
  }
  function isGroupedView() {
    // grouped layout only on "All" filter
    return activeFilter === "all";
  }

  /* ---------- DOM refs ---------- */
  const section = document.getElementById("courses");
  const grid = document.getElementById("coursesGrid");
  const errBox = document.getElementById("coursesError");
  const emptyBox = document.getElementById("coursesEmpty");
  const retryBtn = document.getElementById("coursesRetry");
  const filtersBar = document.getElementById("coursesFilters");

  if (!grid) return;

  /* ---------- State ---------- */
  let allCourses = [];
  let activeFilter = "all";
  let expanded = false; // flat-view toggle
  let groupsExpanded = false; // grouped-view toggle

  /* ---------- Mock data (shown when API is unreachable) ---------- */
  const MOCK_COURSES = [
    {
      slug: "demo-classes",
      title: "Demo Classes",
      category: "Psychology & Therapy",
      group: "Psychology & Therapy",
      level: "Beginner",
      duration: "2 hours",
      shortDescription: "Free demo classes for new users.",
      regularPrice: "",
      offerPrice: "",
    },
    {
      slug: "speech-therapy",
      title: "Speech Therapy",
      category: "Psychology & Therapy",
      group: "Psychology & Therapy",
      level: "Intermediate",
      duration: "2 Weeks",
      shortDescription: "Speech therapy is a very good thing to learn.",
      regularPrice: "6000",
      offerPrice: "5000",
    },
    {
      slug: "child-therapy",
      title: "Child Therapy",
      category: "Psychology & Therapy",
      group: "Psychology & Therapy",
      level: "Beginner",
      duration: "6 weeks",
      shortDescription: "Hi hello",
      regularPrice: "2999",
      offerPrice: "",
    },
    {
      slug: "child-therapy-adv",
      title: "Child Therapy Adv.",
      category: "Psychology & Therapy",
      group: "Psychology & Therapy",
      level: "Beginner",
      duration: "1 week",
      shortDescription: "Child Therapy",
      regularPrice: "800",
      offerPrice: "",
    },
    {
      slug: "cognitive-therapy",
      title: "Cognitive Behavioural Therapy",
      category: "Psychology & Therapy",
      group: "Psychology & Therapy",
      level: "Advanced",
      duration: "8 weeks",
      shortDescription: "Learn evidence-based CBT techniques.",
      regularPrice: "4500",
      offerPrice: "3200",
    },
    {
      slug: "web-dev-basics",
      title: "Web Development Basics",
      category: "Technology",
      group: "Technology",
      level: "Beginner",
      duration: "6 weeks",
      shortDescription: "HTML, CSS and JS from scratch.",
      regularPrice: "3500",
      offerPrice: "2499",
    },
    {
      slug: "react-course",
      title: "React & Modern JS",
      category: "Technology",
      group: "Technology",
      level: "Intermediate",
      duration: "10 weeks",
      shortDescription: "Build real apps with React and hooks.",
      regularPrice: "5500",
      offerPrice: "4200",
    },
    {
      slug: "python-ml",
      title: "Python & Machine Learning",
      category: "Technology",
      group: "Technology",
      level: "Advanced",
      duration: "12 weeks",
      shortDescription: "From Python basics to ML models.",
      regularPrice: "7000",
      offerPrice: "5999",
    },
    {
      slug: "yoga-beginner",
      title: "Yoga for Beginners",
      category: "Wellness",
      group: "Wellness & Fitness",
      level: "Beginner",
      duration: "4 weeks",
      shortDescription: "Morning routines to build flexibility.",
      regularPrice: "1500",
      offerPrice: "",
    },
    {
      slug: "meditation",
      title: "Mindfulness & Meditation",
      category: "Wellness",
      group: "Wellness & Fitness",
      level: "Beginner",
      duration: "3 weeks",
      shortDescription: "Reduce stress and improve focus.",
      regularPrice: "1200",
      offerPrice: "999",
    },
    {
      slug: "business-comm",
      title: "Business Communication",
      category: "Business",
      group: "Business Skills",
      level: "Intermediate",
      duration: "5 weeks",
      shortDescription: "Write and speak with confidence.",
      regularPrice: "2800",
      offerPrice: "2000",
    },
    {
      slug: "leadership",
      title: "Leadership Essentials",
      category: "Business",
      group: "Business Skills",
      level: "Advanced",
      duration: "7 weeks",
      shortDescription: "Lead teams and drive results.",
      regularPrice: "4000",
      offerPrice: "",
    },
  ];

  /* ---------- Fetch ---------- */
  async function fetchCourses() {
    showLoading();
    try {
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller
        ? setTimeout(() => controller.abort(), 8000)
        : null;

      const res = await fetch(ENDPOINT, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller ? controller.signal : undefined,
      });

      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      allCourses = Array.isArray(data) ? data : data.courses || data.data || [];
      buildFilters(allCourses);
      render();
    } catch (err) {
      console.warn(
        "[courses.js] API unreachable (" + err.message + ") — using mock data.",
      );
      // Use mock data so the page is never blank during development
      allCourses = MOCK_COURSES;
      buildFilters(allCourses);
      render();
    }
  }

  /* ---------- Main render dispatcher ---------- */
  function render() {
    if (isGroupedView()) {
      renderGrouped(allCourses);
    } else {
      renderFlat(
        allCourses.filter(
          (c) => normalise(c.category) === normalise(activeFilter),
        ),
      );
    }
  }

  /* ================================================================
     GROUPED VIEW
     Layout:
       desktop: sticky left nav + right rows (horizontal scroll each)
       mobile:  stacked groups, each row horizontally scrollable
  ================================================================ */
  function renderGrouped(courses) {
    grid.classList.remove("courses-loading", "hidden", "courses-grid--flat");
    hide(errBox);
    removeToggleBtn();
    removeSideNav();

    if (!courses.length) {
      grid.innerHTML = "";
      grid.classList.add("hidden");
      show(emptyBox);
      return;
    }
    hide(emptyBox);

    // Build group map preserving backend order.
    // If no course has a "group" field, fall back to using "category" as the group.
    const anyHasGroup = courses.some((c) => (c.group || "").trim());
    const groupMap = new Map(); // groupName → []
    const ungrouped = [];

    courses.forEach((c) => {
      const g = anyHasGroup
        ? (c.group || "").trim()
        : (c.category || "").trim();
      if (!g) {
        ungrouped.push(c);
      } else {
        if (!groupMap.has(g)) groupMap.set(g, []);
        groupMap.get(g).push(c);
      }
    });

    const groupEntries = [...groupMap.entries()]; // [[name, courses], ...]
    if (ungrouped.length) groupEntries.push(["Other Courses", ungrouped]);

    const totalGroups = groupEntries.length;
    const visibleGroups = groupsExpanded
      ? groupEntries
      : groupEntries.slice(0, GROUPS_LIMIT);
    const hasMoreGroups = totalGroups > GROUPS_LIMIT;

    // No groups at all (e.g. courses with no category) — render flat
    if (totalGroups === 0) {
      grid.classList.add("courses-grid--flat");
      const limit = getLimit();
      const hasMore = courses.length > limit;
      grid.innerHTML = (
        hasMore && !expanded ? courses.slice(0, limit) : courses
      )
        .map(cardHTML)
        .join("");
      if (hasMore) insertToggleBtn(courses, "all", limit);
      return;
    }

    // ── Build grouped HTML ──
    // Wrapper replaces #coursesGrid content
    grid.innerHTML = buildGroupedHTML(visibleGroups);
    grid.classList.add("courses-grid--grouped");

    // Show More Groups button
    if (hasMoreGroups) {
      insertGroupsToggleBtn(groupEntries);
    }

    // Init horizontal scroll buttons per row
    initRowScrollBtns();
  }

  function buildGroupedHTML(visibleGroups) {
    return visibleGroups
      .map(([groupName, courses]) => {
        const id = "group-" + slugify(groupName);
        return `
        <div class="cg-group" id="${id}">
          <div class="cg-group-header">
            <h2 class="cg-group-title">${esc(groupName)}</h2>
            <span class="cg-group-count">${courses.length} course${courses.length !== 1 ? "s" : ""}</span>
          </div>
          <div class="cg-row-wrap">
            <button class="cg-scroll-btn cg-scroll-btn--left" aria-label="Scroll left" hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="cg-row" role="list">
              ${courses.map((c) => `<div class="cg-card-wrap" role="listitem">${cardHTML(c)}</div>`).join("")}
            </div>
            <button class="cg-scroll-btn cg-scroll-btn--right" aria-label="Scroll right">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>`;
      })
      .join("");
  }

  function removeSideNav() {
    // no-op — sidenav removed
  }

  /* ---------- Horizontal scroll buttons ---------- */
  function initRowScrollBtns() {
    grid.querySelectorAll(".cg-group").forEach((group) => {
      const row = group.querySelector(".cg-row");
      const btnL = group.querySelector(".cg-scroll-btn--left");
      const btnR = group.querySelector(".cg-scroll-btn--right");
      if (!row || !btnL || !btnR) return;

      const STEP = 320;

      function updateBtns() {
        btnL.hidden = row.scrollLeft <= 4;
        btnR.hidden = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
      }

      btnL.addEventListener("click", () => {
        row.scrollBy({ left: -STEP, behavior: "smooth" });
      });
      btnR.addEventListener("click", () => {
        row.scrollBy({ left: STEP, behavior: "smooth" });
      });
      row.addEventListener("scroll", updateBtns, { passive: true });
      updateBtns();
    });
  }

  /* ---------- Groups toggle button ---------- */
  function insertGroupsToggleBtn(allGroupEntries) {
    removeToggleBtn();
    const remaining = allGroupEntries.length - GROUPS_LIMIT;
    const wrap = document.createElement("div");
    wrap.className = "courses-toggle-wrap";
    wrap.id = "coursesToggleWrap";

    const btn = document.createElement("button");
    btn.className = "courses-toggle-btn";
    btn.id = "coursesToggleBtn";
    btn.setAttribute("aria-expanded", String(groupsExpanded));
    btn.innerHTML = `
      <span class="ctb-label">${groupsExpanded ? "Show Fewer Disciplines" : `Show ${remaining} More Discipline${remaining > 1 ? "s" : ""}`}</span>
      <span class="ctb-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
          stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="${groupsExpanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}"/>
        </svg>
      </span>`;

    btn.addEventListener("click", () => {
      groupsExpanded = !groupsExpanded;
      renderGrouped(allCourses);
      if (!groupsExpanded)
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    wrap.appendChild(btn);
    grid.parentNode.insertBefore(wrap, grid.nextSibling);
  }

  /* ================================================================
     FLAT VIEW  (category filter active)
  ================================================================ */
  function renderFlat(list) {
    removeSideNav();
    grid.classList.remove("courses-loading", "courses-grid--grouped");
    grid.classList.add("courses-grid--flat");
    hide(errBox);
    removeToggleBtn();

    if (!list.length) {
      grid.innerHTML = "";
      grid.classList.add("hidden");
      show(emptyBox);
      return;
    }

    hide(emptyBox);
    grid.classList.remove("hidden");

    const limit = getLimit();
    const hasMore = list.length > limit;

    grid.innerHTML = (hasMore && !expanded ? list.slice(0, limit) : list)
      .map(cardHTML)
      .join("");

    if (hasMore) insertToggleBtn(list, activeFilter, limit);
  }

  /* ---------- Flat show more/less ---------- */
  function insertToggleBtn(list, filter, limit) {
    removeToggleBtn();
    const remaining = list.length - limit;
    const wrap = document.createElement("div");
    wrap.className = "courses-toggle-wrap";
    wrap.id = "coursesToggleWrap";

    const btn = document.createElement("button");
    btn.className = "courses-toggle-btn";
    btn.setAttribute("aria-expanded", String(expanded));
    btn.innerHTML = `
      <span class="ctb-label">${expanded ? "Show Less" : `Show ${remaining} More Course${remaining > 1 ? "s" : ""}`}</span>
      <span class="ctb-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
          stroke="currentColor" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="${expanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}"/>
        </svg>
      </span>`;

    btn.addEventListener("click", () => {
      expanded = !expanded;
      renderFlat(
        filter === "all"
          ? allCourses
          : allCourses.filter(
              (c) => normalise(c.category) === normalise(filter),
            ),
      );
      if (!expanded)
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    wrap.appendChild(btn);
    grid.parentNode.insertBefore(wrap, grid.nextSibling);
  }

  function removeToggleBtn() {
    const old = document.getElementById("coursesToggleWrap");
    if (old) old.remove();
  }

  /* ---------- Loading / Error ---------- */
  function showLoading() {
    removeSideNav();
    removeToggleBtn();
    const count = getSkeletonCount();
    grid.innerHTML = Array(count)
      .fill('<div class="course-skeleton"></div>')
      .join("");
    grid.classList.add("courses-loading");
    grid.classList.remove(
      "hidden",
      "courses-grid--grouped",
      "courses-grid--flat",
    );
    hide(errBox);
    hide(emptyBox);
  }

  function showError() {
    removeSideNav();
    removeToggleBtn();
    grid.innerHTML = "";
    grid.classList.add("hidden");
    hide(emptyBox);
    show(errBox);
  }

  /* ================================================================
     CARD HTML
  ================================================================ */
  function cardHTML(course) {
    const hasOffer =
      course.offerPrice &&
      parseFloat(course.offerPrice) < parseFloat(course.regularPrice);

    const offerBadge = hasOffer
      ? `<div class="offer-badge" aria-label="Special offer">
           <span class="offer-tick" aria-hidden="true">
             <svg viewBox="0 0 24 24" width="9" height="9" fill="none"
               stroke="#22c55e" stroke-width="3.5"
               stroke-linecap="round" stroke-linejoin="round">
               <path d="m5 12 5 5 9-10"/>
             </svg>
           </span>OFFER
         </div>`
      : "";

    const thumbnail = course.image
      ? `<img class="course-thumb" src="${esc(course.image)}" alt="${esc(course.title)}" loading="lazy">`
      : `<div class="course-thumb-placeholder" aria-hidden="true">
           <svg viewBox="0 0 24 24" width="36" height="36" fill="none"
             stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
             <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>
           </svg>
         </div>`;

    const categoryTag = course.category
      ? `<span class="course-tag tag-category">${esc(course.category)}</span>`
      : "";
    const levelTag = course.level
      ? `<span class="course-tag">${esc(course.level)}</span>`
      : "";
    const duration = course.duration
      ? `<div class="course-duration">
           <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
           </svg>${esc(course.duration)}
         </div>`
      : "";

    const priceBlock = hasOffer
      ? `<div class="course-price">
           <span class="price-offer">₹${fmt(course.offerPrice)}</span>
           <span class="price-regular">₹${fmt(course.regularPrice)}</span>
         </div>`
      : course.regularPrice
        ? `<div class="course-price"><span class="price-only">₹${fmt(course.regularPrice)}</span></div>`
        : `<div class="course-price"><span class="price-only">Free</span></div>`;

    return `
      <article class="course-card" data-category="${esc(normalise(course.category || ""))}">
        ${offerBadge}${thumbnail}
        <div class="course-body">
          <div class="course-meta">${categoryTag}${levelTag}</div>
          <h3 class="course-title">${esc(course.title)}</h3>
          ${course.shortDescription ? `<p class="course-desc">${esc(course.shortDescription)}</p>` : ""}
          ${duration}
          <div class="course-divider"></div>
          <div class="course-price-row">
            ${priceBlock}
            <a href="course.html?slug=${esc(course.slug)}" class="course-cta">View Course</a>
          </div>
        </div>
      </article>`;
  }

  /* ---------- Filter tabs ---------- */
  function buildFilters(courses) {
    const categories = [
      ...new Set(courses.map((c) => c.category).filter(Boolean)),
    ];
    if (!filtersBar) return;

    const existing = filtersBar.querySelector('[data-filter="all"]');
    filtersBar.innerHTML = "";
    if (existing) filtersBar.appendChild(existing);

    categories.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "cf-btn";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.dataset.filter = normalise(cat);
      btn.textContent = cat;
      filtersBar.appendChild(btn);
    });

    filtersBar.querySelectorAll(".cf-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        expanded = false;
        groupsExpanded = false;
        filtersBar.querySelectorAll(".cf-btn").forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        render();
      });
    });
  }

  /* ---------- Retry ---------- */
  if (retryBtn) retryBtn.addEventListener("click", fetchCourses);

  /* ---------- Resize ---------- */
  let lastLimit = getLimit();
  window.addEventListener(
    "resize",
    () => {
      const nowLimit = getLimit();
      if (nowLimit !== lastLimit) {
        lastLimit = nowLimit;
        expanded = false;
        if (allCourses.length) render();
      }
    },
    { passive: true },
  );

  /* ---------- Utils ---------- */
  function esc(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function fmt(num) {
    const n = parseFloat(num);
    return isNaN(n) ? num : n.toLocaleString("en-IN");
  }
  function normalise(str) {
    return (str || "").toLowerCase().trim().replace(/\s+/g, "-");
  }
  function slugify(str) {
    return (str || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-");
  }
  function show(el) {
    if (el) el.classList.remove("hidden");
  }
  function hide(el) {
    if (el) el.classList.add("hidden");
  }

  /* ---------- Boot ---------- */
  if (!API_BASE) {
    hide(errBox);
    grid.innerHTML = "";
    grid.classList.remove("courses-loading");
    grid.classList.add("hidden");
    show(emptyBox);
    return;
  }
  fetchCourses();
})();
