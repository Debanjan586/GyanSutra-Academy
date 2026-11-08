/* ===================== WHY GYANSUTRA — data-driven comparison table ===================== */
(function () {
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function renderHeader(headerEl, heading) {
    if (!headerEl || !heading) return;
    var labelHtml =
      '<p class="section-label"><span></span>' +
      escapeHtml(heading.label || "") +
      "<span></span></p>";
    // title may contain an inline <span class="amber"> for emphasis — trusted content from your own JSON, not user input
    var titleHtml = "<h2>" + (heading.title || "") + "</h2>";
    var subtitleHtml = heading.subtitle
      ? "<p>" + escapeHtml(heading.subtitle) + "</p>"
      : "";
    headerEl.innerHTML = labelHtml + titleHtml + subtitleHtml;
  }

  function renderTable(tableWrapEl, columns, rows) {
    if (!tableWrapEl || !rows || !rows.length) return;

    var leftLabel = (columns && columns.left) || "Other Institutes";
    var rightLabel = (columns && columns.right) || "GyanSutra Academy";

    var theadHtml =
      "<thead><tr>" +
      "<th></th>" +
      '<th class="why-col-left">' +
      escapeHtml(leftLabel) +
      "</th>" +
      '<th class="why-col-right">' +
      escapeHtml(rightLabel) +
      "</th>" +
      "</tr></thead>";

    var tbodyHtml =
      "<tbody>" +
      rows
        .map(function (row) {
          return (
            "<tr>" +
            '<td class="why-feature">' +
            escapeHtml(row.feature || "") +
            "</td>" +
            '<td class="why-col-left">' +
            escapeHtml(row.left || "") +
            "</td>" +
            '<td class="why-col-right">' +
            escapeHtml(row.right || "") +
            "</td>" +
            "</tr>"
          );
        })
        .join("") +
      "</tbody>";

    tableWrapEl.innerHTML =
      '<div class="why-table-scroll"><table class="why-table">' +
      theadHtml +
      tbodyHtml +
      "</table></div>";
  }

  function enableDragToScroll(tableWrap) {
    var scrollEl = tableWrap.querySelector(".why-table-scroll");
    if (!scrollEl) return;

    var isDown = false;
    var startX = 0;
    var startScrollLeft = 0;
    var moved = false;

    function onPointerDown(e) {
      // Only left-click / single touch; let native touch scrolling handle touch devices on its own
      if (e.pointerType === "touch") return;
      isDown = true;
      moved = false;
      scrollEl.classList.add("is-dragging");
      startX = e.clientX;
      startScrollLeft = scrollEl.scrollLeft;
      scrollEl.setPointerCapture && scrollEl.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!isDown) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      scrollEl.scrollLeft = startScrollLeft - dx;
    }

    function onPointerUp(e) {
      isDown = false;
      scrollEl.classList.remove("is-dragging");
    }

    scrollEl.addEventListener("pointerdown", onPointerDown);
    scrollEl.addEventListener("pointermove", onPointerMove);
    scrollEl.addEventListener("pointerup", onPointerUp);
    scrollEl.addEventListener("pointerleave", onPointerUp);
    scrollEl.addEventListener("pointercancel", onPointerUp);

    // Prevent accidental text selection while dragging
    scrollEl.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    // Avoid firing stray clicks right after a drag
    scrollEl.addEventListener(
      "click",
      function (e) {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  }

  function initWhySection() {
    var header = document.getElementById("whyHeader");
    var tableWrap = document.getElementById("whyTableWrap");
    if (!tableWrap) return;

    fetch("./why-us-section/why-data.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load why-data.json");
        return res.json();
      })
      .then(function (data) {
        renderHeader(header, data.heading);
        renderTable(tableWrap, data.columns, data.rows);
        enableDragToScroll(tableWrap);
      })
      .catch(function (err) {
        console.error("Why section: could not load content.", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhySection);
  } else {
    initWhySection();
  }
})();
