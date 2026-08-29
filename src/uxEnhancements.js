/*
 * Small, non-invasive UX polish for the detail sheet and network reconnect.
 * This intentionally lives outside App.jsx so visual behaviour can evolve
 * without coupling it to the ledger state machine.
 */

const STYLE_ID = "ipo-ux-enhancements";
let observer;
let reconnectTimer = null;
let reconnectBusy = false;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .ipo-enhanced-sheet {
      --ipo-sheet-drag-y: 0px;
      transform: translateY(var(--ipo-sheet-drag-y)) !important;
      transition: transform 180ms ease;
      will-change: transform;
    }
    .ipo-enhanced-sheet.ipo-sheet-dragging { transition: none !important; }
    .ipo-enhanced-sheet .ipo-fixed-date-row {
      display: grid !important;
      grid-template-columns: 92px minmax(0, 1fr) !important;
      align-items: center !important;
      column-gap: 12px !important;
      min-height: 32px;
    }
    .ipo-enhanced-sheet .ipo-fixed-date-row > :first-child {
      font-family: Inter, sans-serif !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      color: inherit;
    }
    .ipo-enhanced-sheet .ipo-fixed-date-row > :not(:first-child) {
      font-family: Inter, sans-serif !important;
    }
    .ipo-enhanced-sheet .ipo-note-field {
      font-family: Inter, sans-serif !important;
      font-size: 14px !important;
      line-height: 1.45 !important;
    }
    .ipo-enhanced-sheet .ipo-note-save {
      font-family: Inter, sans-serif !important;
    }
    .ipo-enhanced-sheet .ipo-note-save:disabled {
      opacity: .48 !important;
      cursor: default !important;
    }
    .ipo-enhanced-sheet .ipo-detail-action {
      font-family: Inter, sans-serif !important;
    }
  `;
  document.head.appendChild(style);
}

function directTextButton(button, from, to) {
  for (const node of button.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.includes(from)) {
      node.textContent = node.textContent.replace(from, to);
      return true;
    }
  }
  if (button.textContent.includes(from)) {
    button.textContent = button.textContent.replace(from, to);
    return true;
  }
  return false;
}

function findExactText(root, text) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const found = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.children.length === 0 && node.textContent.trim() === text) found.push(node);
  }
  return found;
}

function prepareDetailSheet(panel) {
  if (panel.dataset.ipoUxPrepared === "1") return;
  const text = panel.textContent || "";
  if (!text.includes("IPO actions") || !text.includes("Note")) return;

  panel.classList.add("ipo-enhanced-sheet");
  panel.dataset.ipoUxPrepared = "1";

  /* The individual-application action is intentionally gone. Bulk application
     is the only IPO-level application entry point. */
  findExactText(panel, "Add one").forEach((label) => {
    const button = label.closest("button");
    if (button) button.remove();
  });

  findExactText(panel, "Apply in bulk").forEach((label) => {
    const button = label.closest("button");
    if (button) directTextButton(button, "Apply in bulk", "Apply IPO");
  });

  /* The note is self-explanatory; the helper sentence adds noise. */
  findExactText(panel, "Only this note is editable here.").forEach((label) => label.remove());

  const note = panel.querySelector('textarea[aria-label="IPO note"]');
  if (note) {
    note.classList.add("ipo-note-field");
    let baseline = note.value;
    let saveButton = null;

    const syncSaveState = () => {
      saveButton = note.parentElement?.parentElement?.querySelector("button");
      if (!saveButton) return;
      saveButton.classList.add("ipo-note-save");
      const dirty = note.value !== baseline;
      saveButton.disabled = !dirty;
      if (!dirty && saveButton.textContent.trim() === "Saved") {
        directTextButton(saveButton, "Saved", "Save note");
      }
    };

    note.addEventListener("input", syncSaveState, { passive: true });
    note.addEventListener("change", syncSaveState, { passive: true });

    const saveObserver = new MutationObserver(() => {
      const button = note.parentElement?.parentElement?.querySelector("button");
      if (!button) return;
      button.classList.add("ipo-note-save");
      if (button.textContent.trim() === "Saved") directTextButton(button, "Saved", "Save note");
      const dirty = note.value !== baseline;
      button.disabled = !dirty;
    });
    saveObserver.observe(note.parentElement?.parentElement || panel, { childList: true, subtree: true, characterData: true });

    const saveContainer = note.parentElement?.parentElement;
    saveContainer?.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      baseline = note.value;
      requestAnimationFrame(syncSaveState);
    });

    syncSaveState();
  }

  /* Give the official date rows a stable label column so different date text
     widths cannot make the timeline jump around. */
  ["Open", "Close", "Allotment", "Listing"].forEach((labelText) => {
    findExactText(panel, labelText).forEach((label) => {
      const row = label.parentElement;
      if (row && row.children.length >= 2) row.classList.add("ipo-fixed-date-row");
    });
  });

  /* Swipe down to dismiss is only armed while the sheet body is at its top.
     Normal upward/downward scrolling remains untouched once the body has
     scrolled. Inputs/buttons are excluded so editing never dismisses a sheet. */
  const scroller = Array.from(panel.querySelectorAll("div")).find((el) => {
    const style = getComputedStyle(el);
    return style.overflowY === "auto" && el.scrollHeight > el.clientHeight;
  });
  if (!scroller) return;

  let startY = 0;
  let dragging = false;
  let lastY = 0;

  scroller.addEventListener("touchstart", (event) => {
    if (scroller.scrollTop !== 0) return;
    if (event.target.closest("input, textarea, select, button, a")) return;
    startY = event.touches[0].clientY;
    lastY = startY;
    dragging = false;
  }, { passive: true });

  scroller.addEventListener("touchmove", (event) => {
    if (!startY || scroller.scrollTop !== 0) return;
    const y = event.touches[0].clientY;
    const delta = y - startY;
    lastY = y;
    if (delta <= 0) return;
    if (delta > 8) {
      dragging = true;
      panel.classList.add("ipo-sheet-dragging");
      panel.style.setProperty("--ipo-sheet-drag-y", `${Math.min(delta, 220)}px`);
      event.preventDefault();
    }
  }, { passive: false });

  scroller.addEventListener("touchend", () => {
    if (!startY) return;
    const delta = lastY - startY;
    startY = 0;
    panel.classList.remove("ipo-sheet-dragging");
    if (dragging && delta > 80 && scroller.scrollTop === 0) {
      const overlay = panel.parentElement;
      panel.style.setProperty("--ipo-sheet-drag-y", "100%");
      setTimeout(() => overlay?.click(), 120);
    } else {
      panel.style.setProperty("--ipo-sheet-drag-y", "0px");
    }
    dragging = false;
  }, { passive: true });
}

function polishDetailSheets() {
  document.querySelectorAll('div[style*="z-index: 50"] > div').forEach(prepareDetailSheet);
}

function polishMarketStatus() {
  const nodes = Array.from(document.querySelectorAll("div"));
  nodes.forEach((node) => {
    if (node.children.length !== 0) return;
    const value = node.textContent.trim();
    if (!value.includes("IPOs matched on Upstox")) return;
    const match = value.match(/last traded price,\s*(.+)$/i);
    node.textContent = match ? `Prices updated ${match[1]}` : "Market prices updated";
  });

  nodes.forEach((node) => {
    if (node.children.length !== 0) return;
    if (node.textContent.trim() === "Fetching from Upstox…") node.textContent = "Updating market prices…";
  });
}

function triggerReconnectRefresh() {
  if (reconnectBusy || !navigator.onLine) return;
  reconnectBusy = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const sync = buttons.find((b) => /^(Sync now|Syncing…)$/.test(b.textContent.trim()));
    const prices = buttons.find((b) => /^(Update market prices|Updating market prices…)$/.test(b.textContent.trim()));
    if (sync && !sync.disabled) sync.click();
    setTimeout(() => {
      if (prices && !prices.disabled) prices.click();
      reconnectBusy = false;
    }, 900);
  }, 700);
}

export function installUxEnhancements() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  injectStyles();
  polishDetailSheets();
  polishMarketStatus();

  if (!observer) {
    observer = new MutationObserver(() => {
      polishDetailSheets();
      polishMarketStatus();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.addEventListener("online", triggerReconnectRefresh, { passive: true });
}
