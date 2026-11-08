(function () {
  'use strict';

  const API = 'https://gyansutra-academy.onrender.com'; // demo: calls will fail gracefully, this is just to preview UI/UX

  /* ── Auth guard (disabled in static preview) ── */

  /* ── DOM ── */
  const tbody        = document.getElementById('courseList');
  const statTotal    = document.getElementById('statTotal');
  const statPub      = document.getElementById('statPublished');
  const statUnpub    = document.getElementById('statUnpublished');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const modal        = document.getElementById('courseModal');
  const modalTitle   = document.getElementById('modalTitle');
  const courseForm   = document.getElementById('courseForm');
  const formError    = document.getElementById('formError');
  const courseId     = document.getElementById('courseId');
  const fTitle       = document.getElementById('fTitle');
  const fShortDesc   = document.getElementById('fShortDesc');
  const fDesc        = document.getElementById('fDesc');
  const fCategory    = document.getElementById('fCategory');
  const fLevel       = document.getElementById('fLevel');
  const fDuration    = document.getElementById('fDuration');
  const fOrder       = document.getElementById('fOrder');
  const fRegPrice    = document.getElementById('fRegPrice');
  const fOfferPrice  = document.getElementById('fOfferPrice');
  const fIsFree      = document.getElementById('fIsFree');
  const fImage       = document.getElementById('fImage');
  const fPublished   = document.getElementById('fPublished');
  const confirmOverlay = document.getElementById('confirmOverlay');
  const confirmMsg     = document.getElementById('confirmMsg');
  const confirmDelete  = document.getElementById('confirmDelete');
  const confirmCancel  = document.getElementById('confirmCancel');
  const toast          = document.getElementById('toast');

  /* ── Image upload UI ── */
  const imgTabs        = document.querySelectorAll('.img-tab');
  const imgPanelUpload = document.getElementById('imgPanelUpload');
  const imgPanelUrl    = document.getElementById('imgPanelUrl');
  const fImageUrl      = document.getElementById('fImageUrl');
  const dropZone       = document.getElementById('dropZone');
  const dropLabel      = document.getElementById('dropLabel');
  const imgFileInput   = document.getElementById('imgFileInput');
  const uploadStatus   = document.getElementById('uploadStatus');
  const imgPreviewWrap = document.getElementById('imgPreviewWrap');
  const imgPreview     = document.getElementById('imgPreview');
  const imgClear       = document.getElementById('imgClear');

  let activeImgTab = 'upload';

  imgTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeImgTab = tab.dataset.tab;
      imgTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === activeImgTab));
      imgPanelUpload.style.display = activeImgTab === 'upload' ? '' : 'none';
      imgPanelUrl.style.display    = activeImgTab === 'url'    ? '' : 'none';
    });
  });

  fImageUrl.addEventListener('input', () => setImageValue(fImageUrl.value.trim()));

  imgFileInput.addEventListener('change', () => {
    if (imgFileInput.files[0]) uploadFile(imgFileInput.files[0]);
  });

  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragging'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
    else showUploadStatus('Only image files allowed.', 'fail');
  });

  imgClear.addEventListener('click', () => {
    setImageValue('');
    imgFileInput.value = '';
    fImageUrl.value = '';
    dropLabel.innerHTML = 'Drag & drop or <u>click to choose</u>';
    hideUploadStatus();
  });

  function setImageValue(url) {
    fImage.value = url;
    if (url) {
      imgPreview.src = url;
      imgPreviewWrap.style.display = '';
    } else {
      imgPreviewWrap.style.display = 'none';
      imgPreview.src = '';
    }
  }

  async function uploadFile(file) {
    showUploadStatus('Uploading…', 'uploading');
    dropLabel.textContent = file.name;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch(API + '/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await r.json();
      if (!r.ok) { showUploadStatus(data.error || 'Upload failed.', 'fail'); return; }
      setImageValue(data.url);
      showUploadStatus('✓ Uploaded successfully!', 'done');
    } catch (_) {
      showUploadStatus('Network error during upload.', 'fail');
    }
  }

  function showUploadStatus(msg, type) {
    uploadStatus.textContent = msg;
    uploadStatus.className = `upload-status ${type}`;
    uploadStatus.style.display = '';
  }
  function hideUploadStatus() { uploadStatus.style.display = 'none'; }

  function resetImageUI() {
    setImageValue('');
    imgFileInput.value = '';
    fImageUrl.value = '';
    dropLabel.innerHTML = 'Drag & drop or <u>click to choose</u>';
    hideUploadStatus();
    activeImgTab = 'upload';
    imgTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'upload'));
    imgPanelUpload.style.display = '';
    imgPanelUrl.style.display    = 'none';
  }

  /* ── Free course toggle ── */
  fIsFree.addEventListener('change', () => {
    if (fIsFree.checked) {
      fOfferPrice.value = '';
      fOfferPrice.disabled = true;
      clearFieldError(fOfferPrice);
    } else {
      fOfferPrice.disabled = false;
    }
  });

  /* ── Fetch courses ── */
  async function loadCourses() {
    tbody.innerHTML = '<div class="course-empty">Loading courses…</div>';
    try {
      const r = await fetch(API + '/api/admin/courses', { credentials: 'include' });
      if (r.status === 401) { window.location.replace('/admin/login/'); return; }
      if (!r.ok) { tbody.innerHTML = '<div class="course-empty">Failed to load. Check your connection.</div>'; return; }
      const data = await r.json();

      const courses = data.courses || [];
      statTotal.textContent    = data.total      ?? courses.length;
      statPub.textContent      = data.published  ?? courses.filter(c => c.published).length;
      statUnpub.textContent    = data.unpublished ?? courses.filter(c => !c.published).length;
      pageSubtitle.textContent = `${data.total ?? courses.length} course${(data.total ?? courses.length) === 1 ? '' : 's'} in the system`;

      if (!courses.length) {
        tbody.innerHTML = '<div class="course-empty">No courses yet. Add your first one!</div>';
        return;
      }
      tbody.innerHTML = courses.map(rowHTML).join('');
      attachRowEvents();
    } catch (_) {
      tbody.innerHTML = '<div class="course-empty">Failed to load. Check your connection.</div>';
    }
  }

  /* ── Course card ── */
  function rowHTML(c) {
    const priceText = c.offerPrice
      ? `<strong>₹${fmt(c.offerPrice)}</strong> <del style="font-size:0.72rem;opacity:0.6;">₹${fmt(c.regularPrice)}</del>`
      : `<strong>₹${fmt(c.regularPrice)}</strong>`;
    const thumb = c.image
      ? `<div class="cc-thumb"><img src="${esc(c.image)}" alt=""></div>`
      : `<div class="cc-thumb"><span class="cc-thumb-empty"></span></div>`;

    return `
      <div class="course-card">
        ${thumb}
        <div class="cc-info">
          <div class="cc-title">${esc(c.title)}</div>
          <div class="cc-slug">${esc(c.slug)}</div>
          <div class="cc-meta">
            <span>${esc(c.category) || '—'}</span>
            <span>${priceText}</span>
            <span class="badge-pub ${c.published ? 'yes' : 'no'}">
              ${c.published ? '● Published' : '○ Draft'}
            </span>
          </div>
        </div>
        <div class="cc-actions">
          <button class="btn-sm" data-action="edit" data-id="${c._id}">Edit</button>
          <button class="btn-sm ${c.published ? 'btn-unpublish' : 'btn-publish'}"
            data-action="toggle" data-id="${c._id}" data-published="${c.published}">
            ${c.published ? 'Unpublish' : 'Publish'}
          </button>
          <button class="btn-sm btn-danger" data-action="delete" data-id="${c._id}" data-title="${esc(c.title)}">Delete</button>
        </div>
      </div>`;
  }

  function attachRowEvents() {
    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id, published, title } = btn.dataset;
        if (action === 'edit')   openEdit(id);
        if (action === 'toggle') togglePublish(id, published === 'true');
        if (action === 'delete') openConfirmDelete(id, title);
      });
    });
  }

  /* ── Add / Edit modal ── */
  document.getElementById('addCourseBtn').addEventListener('click', openAdd);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function openAdd() {
    modalTitle.textContent = 'Add New Course';
    courseForm.reset();
    courseId.value = '';
    fIsFree.checked = false;
    fOfferPrice.disabled = false;
    resetImageUI();
    hideFormError();
    clearAllFieldErrors();
    modal.classList.add('open');
    fTitle.focus();
  }

  async function openEdit(id) {
    modalTitle.textContent = 'Edit Course';
    courseForm.reset();
    resetImageUI();
    hideFormError();
    clearAllFieldErrors();
    modal.classList.add('open');
    try {
      const r = await fetch(`${API}/api/admin/courses/${id}`, { credentials: 'include' });
      if (!r.ok) { showToast('Course not found.', 'error'); closeModal(); return; }
      const c = await r.json();

      courseId.value      = c._id;
      fTitle.value        = c.title || '';
      fShortDesc.value    = c.shortDescription || '';
      fDesc.value         = c.description || '';
      fCategory.value     = c.category || '';
      fLevel.value        = c.level || '';
      fDuration.value     = c.duration || '';
      fOrder.value        = c.displayOrder ?? 0;
      fRegPrice.value     = c.regularPrice ?? '';
      const isFree        = c.regularPrice == 0 && !c.offerPrice;
      fIsFree.checked     = isFree;
      fOfferPrice.value   = c.offerPrice != null ? c.offerPrice : '';
      fOfferPrice.disabled = isFree;
      fPublished.checked  = !!c.published;

      if (c.image) {
        setImageValue(c.image);
        activeImgTab = 'url';
        imgTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'url'));
        imgPanelUpload.style.display = 'none';
        imgPanelUrl.style.display    = '';
        fImageUrl.value = c.image;
      }
    } catch (_) {
      showToast('Failed to load course data.', 'error');
      closeModal();
    }
  }

  function closeModal() { modal.classList.remove('open'); }

  /* ── Validation helpers ── */
  function markInvalid(input, show) {
    const group = input.closest('.form-group') || input.closest('.form-check');
    if (!group) return;
    group.classList.toggle('invalid', show);
  }
  function clearFieldError(input) { markInvalid(input, false); }
  function clearAllFieldErrors() {
    document.querySelectorAll('#courseForm .form-group.invalid, #courseForm .form-check.invalid-check')
      .forEach(g => g.classList.remove('invalid', 'invalid-check'));
  }
  // re-validate a field live once the user starts correcting it
  [fTitle, fShortDesc, fDuration, fRegPrice, fOfferPrice].forEach(inp => {
    inp.addEventListener('input', () => { if (inp.closest('.form-group').classList.contains('invalid')) validateField(inp); });
  });
  fPublished.addEventListener('change', () => {
    const grp = fPublished.closest('.form-check');
    if (grp.classList.contains('invalid-check')) { grp.classList.remove('invalid-check'); clearFieldError(fPublished); }
  });

  function validateField(input) {
    let ok = true;
    if (input === fTitle)      ok = fTitle.value.trim().length > 0;
    if (input === fShortDesc)  ok = fShortDesc.value.trim().length > 0;
    if (input === fDuration)   ok = fDuration.value.trim().length > 0;
    if (input === fRegPrice) {
      const v = parseFloat(fRegPrice.value);
      ok = fRegPrice.value.trim() !== '' && !isNaN(v) && v >= 0;
    }
    if (input === fOfferPrice && !fIsFree.checked && fOfferPrice.value.trim() !== '') {
      const off = parseFloat(fOfferPrice.value);
      const reg = parseFloat(fRegPrice.value);
      ok = !isNaN(off) && off >= 0 && (isNaN(reg) || off < reg);
    }
    markInvalid(input, !ok);
    return ok;
  }

  function validateForm() {
    clearAllFieldErrors();
    let firstInvalid = null;
    const checks = [fTitle, fShortDesc, fDuration, fRegPrice];
    if (!fIsFree.checked && fOfferPrice.value.trim() !== '') checks.push(fOfferPrice);

    checks.forEach(inp => {
      const ok = validateField(inp);
      if (!ok && !firstInvalid) firstInvalid = inp;
    });

    return firstInvalid;
  }

  /* ── Form submit ── */
  courseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideFormError();

    const firstInvalid = validateForm();
    if (firstInvalid) {
      firstInvalid.focus();
      return showFormError('Please fix the highlighted fields below.');
    }

    const body = {
      title:            fTitle.value.trim(),
      shortDescription: fShortDesc.value.trim(),
      description:      fDesc.value.trim(),
      category:         fCategory.value.trim(),
      level:            fLevel.value,
      duration:         fDuration.value.trim(),
      displayOrder:     parseInt(fOrder.value, 10) || 0,
      regularPrice:     fIsFree.checked ? 0 : fRegPrice.value,
      offerPrice:       (!fIsFree.checked && fOfferPrice.value !== '') ? fOfferPrice.value : null,
      image:            fImage.value.trim(),
      published:        fPublished.checked,
    };

    const isEdit = !!courseId.value;
    const url    = isEdit ? `${API}/api/admin/courses/${courseId.value}` : `${API}/api/admin/courses`;
    const method = isEdit ? 'PATCH' : 'POST';

    const submitBtn = document.getElementById('formSubmitBtn');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Saving…';

    try {
      const r    = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) return showFormError(data.error || 'Failed to save course.');
      closeModal();
      showToast(isEdit ? 'Course updated!' : 'Course created!', 'success');
      loadCourses();
    } catch (_) {
      showFormError('Network error. Try again.');
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Save Course';
    }
  });

  /* ── Toggle publish ── */
  async function togglePublish(id, currentlyPublished) {
    try {
      const r = await fetch(`${API}/api/admin/courses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ published: !currentlyPublished }),
      });
      if (!r.ok) { const d = await r.json(); showToast(d.error || 'Failed.', 'error'); return; }
      showToast(currentlyPublished ? 'Course unpublished.' : 'Course published!', 'success');
      loadCourses();
    } catch (_) {
      showToast('Network error.', 'error');
    }
  }

  /* ── Delete ── */
  let pendingDeleteId = null;

  function openConfirmDelete(id, title) {
    pendingDeleteId = id;
    confirmMsg.textContent = `"${title}" will be permanently deleted.`;
    confirmOverlay.classList.add('open');
  }
  confirmCancel.addEventListener('click', () => {
    confirmOverlay.classList.remove('open');
    pendingDeleteId = null;
  });
  confirmDelete.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    confirmOverlay.classList.remove('open');
    try {
      const r = await fetch(`${API}/api/admin/courses/${pendingDeleteId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!r.ok) { const d = await r.json(); showToast(d.error || 'Delete failed.', 'error'); return; }
      showToast('Course deleted.', 'success');
      loadCourses();
    } catch (_) {
      showToast('Network error.', 'error');
    } finally { pendingDeleteId = null; }
  });
  confirmOverlay.addEventListener('click', e => {
    if (e.target === confirmOverlay) { confirmOverlay.classList.remove('open'); pendingDeleteId = null; }
  });

  /* ── Logout ── */
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await fetch(API + '/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch (_) {}
    window.location.replace('/admin/login/');
  });

  /* ── Helpers ── */
  let toastTimer;
  function showToast(msg, type = '') {
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function showFormError(msg) { formError.textContent = msg; formError.classList.add('show'); }
  function hideFormError()    { formError.classList.remove('show'); }
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function fmt(n) { const x = parseFloat(n); return isNaN(x) ? n : x.toLocaleString('en-IN'); }

  loadCourses();
})();