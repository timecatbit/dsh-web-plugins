const dshPhoneComposerEditor = '[data-composer-card] [contenteditable="true"]';
const dshPhoneComposerSearch = '[data-composer-card] [data-composer-overlay] input';
const dshPhoneEditable = 'input, textarea, select, [contenteditable="true"]';

function installPhoneComposerFocus(media) {
  // Older DSH runs its mount/session-switch focus effect before a mutation
  // observer can mark a new editor. Stop only that composer focus at the DOM
  // call so iOS never sees the focus/blur pair that can flash the keyboard.
  const prototype = HTMLElement.prototype;
  const focus = prototype.focus;
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const requiresTap = () => coarsePointer.matches || (media.matches && navigator.maxTouchPoints > 0);
  let tappedEditor;
  let tappedUntil = 0;
  let tabUntil = 0;

  function authorized(editor, from) {
    const now = performance.now();
    // Focus moving between composer fields keeps the keyboard that is
    // already up, e.g. returning from the command popup's search field.
    return now < tabUntil || (editor === tappedEditor && now < tappedUntil) ||
      (from instanceof Element && from !== editor && from.matches(dshPhoneEditable) &&
        from.closest("[data-composer-card]") === editor.closest("[data-composer-card]"));
  }

  function onInputGesture(event) {
    tappedEditor = undefined;
    tabUntil = 0;
    if (!requiresTap() || !event.isTrusted || !(event.target instanceof Element)) return;
    const target = event.target;
    const card = target.closest("[data-composer-card]");
    const direct = target.closest(dshPhoneComposerEditor);
    const otherControl = target.closest('button, a, input, select, textarea, [role="button"], [tabindex], [data-composer-overlay]');
    if (!card || (!direct && otherControl && card.contains(otherControl))) return;
    tappedEditor = direct ?? card.querySelector(dshPhoneComposerEditor);
    tappedUntil = performance.now() + 650;
  }

  function phoneComposerFocus(...args) {
    if (requiresTap() && this instanceof HTMLElement && document.activeElement !== this) {
      if (this.matches(dshPhoneComposerEditor) && !authorized(this, document.activeElement)) return;
      // The command popup focuses its search field when it opens. Coming
      // from the open editor that keeps the keyboard; after a toolbar tap it
      // would raise the keyboard over the list. The field still takes taps.
      if (this.matches(dshPhoneComposerSearch) && !document.activeElement?.matches?.(dshPhoneEditable)) return;
    }
    return focus.apply(this, args);
  }

  function onTab(event) {
    if (event.isTrusted && event.key === "Tab") tabUntil = performance.now() + 400;
  }

  function onComposerFocus(event) {
    // WebKit can also focus contenteditable as a side effect of restoring
    // the DOM selection, without calling HTMLElement.focus().
    const editor = event.target;
    if (requiresTap() && editor instanceof HTMLElement && editor.matches(dshPhoneComposerEditor) &&
      !authorized(editor, event.relatedTarget)) editor.blur();
  }

  prototype.focus = phoneComposerFocus;
  for (const type of ["pointerdown", "click"]) document.addEventListener(type, onInputGesture, true);
  document.addEventListener("keydown", onTab, true);
  document.addEventListener("focus", onComposerFocus, true);
  return () => {
    if (prototype.focus === phoneComposerFocus) prototype.focus = focus;
    for (const type of ["pointerdown", "click"]) document.removeEventListener(type, onInputGesture, true);
    document.removeEventListener("keydown", onTab, true);
    document.removeEventListener("focus", onComposerFocus, true);
  };
}

function stampDshPhoneColumns(frame) {
  const columns = [...frame.children].filter(column => column instanceof HTMLElement);
  // The newer shell may insert a native mask before the actual sidebar.
  const sidebar = columns.find(column => column.querySelector(':scope > [data-slot="sidebar"]'));
  const details = columns.find(column => column.hasAttribute("data-rightbar-col") ||
    column.querySelector(':scope > [data-slot="rightbar"]'));
  const center = sidebar && columns[columns.indexOf(sidebar) + 1];
  const roles = ["sidebar", "center", "details"];
  const parts = sidebar && details && center && center !== details
    ? [sidebar, center, details]
    : columns.filter(column => !column.hasAttribute("data-sidebar-mask")).slice(0, 3);
  for (const column of columns) {
    const role = roles[parts.indexOf(column)];
    if (role && column.dataset.mobileRole !== role) column.dataset.mobileRole = role;
    else if (!role && column.hasAttribute("data-mobile-role")) column.removeAttribute("data-mobile-role");
  }
}

function installPhoneViewport(media) {
  // The keyboard pans WebKit's visual viewport across the fixed app, in step
  // with its own animation, and the final geometry is reported only after
  // that animation. Moving or resizing the app from those reports replays
  // the motion as a jump. Leave the app at the full layout viewport so the
  // native pan carries the composer, and only clear a pan that remains once
  // the keyboard has gone.
  const html = document.documentElement;
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  let settled = 0;

  function settle() {
    settled = 0;
    if (!media.matches || Math.abs(viewport.scale - 1) >= 0.05) return;
    if (document.activeElement?.matches?.(dshPhoneEditable)) return;
    if (Math.max(window.innerHeight, html.clientHeight) - viewport.height > 1) return;
    if (viewport.offsetTop > 0.5 || window.scrollY > 0.5) window.scrollTo(0, 0);
  }

  function schedule() {
    window.clearTimeout(settled);
    settled = window.setTimeout(settle, 240);
  }

  viewport.addEventListener("resize", schedule);
  viewport.addEventListener("scroll", schedule);
  document.addEventListener("focusout", schedule);
  return () => {
    viewport.removeEventListener("resize", schedule);
    viewport.removeEventListener("scroll", schedule);
    document.removeEventListener("focusout", schedule);
    window.clearTimeout(settled);
  };
}

function installPhoneLayout(layout) {
  const html = document.documentElement;
  const media = window.matchMedia(MOBILE_QUERY$2);
  const stopComposerFocus = installPhoneComposerFocus(media);
  const stopViewport = installPhoneViewport(media);
  const observer = new MutationObserver(schedule);
  const nav = document.createElement("button");
  nav.type = "button";
  nav.dataset.dshPhoneNav = "";
  nav.setAttribute("aria-label", "菜单");
  nav.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  nav.addEventListener("click", () => layout.toggleSidebar());
  const close = document.createElement("button");
  close.type = "button";
  close.dataset.dshPhoneClose = "";
  close.setAttribute("aria-label", "关闭侧栏");
  close.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  close.addEventListener("click", () => layout.toggleSidebar());
  let pending = 0;
  let previous;
  let sidebarNavigationUntil = 0;

  function schedule() {
    if (pending) return;
    pending = window.requestAnimationFrame(sync);
  }

  function sync() {
    pending = 0;
    const phone = media.matches;
    html.toggleAttribute("data-dsh-phone", phone);
    const frame = document.querySelector("[data-mobile-frame]");
    const center = frame?.querySelector(":scope > [data-mobile-role=center]");
    if (!phone || !center) {
      if (nav.isConnected) nav.remove();
      if (close.isConnected) close.remove();
      previous?.frame.removeAttribute("data-dsh-phone-global-page");
      previous = undefined;
      return;
    }
    const sidebar = frame.querySelector(":scope > [data-mobile-role=sidebar]");
    const sidebarOpen = sidebar && !frame.hasAttribute("data-sidebar-collapsed");
    const hostClose = sidebar && [...sidebar.querySelectorAll('button[aria-label], button[title]')].find(button =>
      button !== close && /(?:close|collapse)(?: left)? sidebar|(?:收起|关闭).*侧栏/i.test(
        button.getAttribute("aria-label") || button.getAttribute("title") || ""));
    if (sidebarOpen && !hostClose) {
      if (close.parentElement !== sidebar) sidebar.appendChild(close);
    } else if (close.isConnected) close.remove();
    const content = center.querySelector("[data-conversation-content]");
    const session = content?.getAttribute("data-conversation-session") ?? null;
    const panel = center.firstElementChild;
    const routeChanged = previous?.frame === frame &&
      (previous.panel !== panel || previous.session !== session || !!previous.content !== !!content);
    previous = { frame, panel, session, content };
    if (routeChanged && performance.now() < sidebarNavigationUntil) {
      sidebarNavigationUntil = 0;
      if (!frame.hasAttribute("data-sidebar-collapsed")) layout.toggleSidebar();
      if (rightOpen(frame)) layout.closeRightbar();
    }
    const needsNav = !center.querySelector("[data-dsh-phone-header-menu]");
    frame.toggleAttribute("data-dsh-phone-global-page", needsNav);
    nav.hidden = !needsNav;
    nav.setAttribute("aria-expanded", String(!frame.hasAttribute("data-sidebar-collapsed")));
    if (nav.parentElement !== frame) frame.appendChild(nav);
    for (const editor of center.querySelectorAll(dshPhoneComposerEditor)) {
      if (editor.getAttribute("enterkeyhint") !== "send") editor.setAttribute("enterkeyhint", "send");
    }
    // The context meter shows a bare percentage. Its localized label minus
    // that reading ("上下文已用", "of context used") becomes the caption.
    for (const meter of center.querySelectorAll("[data-composer-dock] > :not([data-slot]) button[aria-label]")) {
      const reading = meter.querySelector(":scope > span")?.textContent?.trim();
      const label = meter.getAttribute("aria-label") ?? "";
      const caption = reading && label.includes(reading) ? label.replace(reading, "").trim() : "";
      if (!caption) meter.removeAttribute("data-dsh-phone-caption");
      else if (meter.getAttribute("data-dsh-phone-caption") !== caption) meter.setAttribute("data-dsh-phone-caption", caption);
    }
  }

  function rightOpen(frame) {
    return frame.hasAttribute("data-rightbar-fullscreen") || !frame.hasAttribute("data-rightbar-collapsed");
  }

  function onPhoneClick(event) {
    if (!media.matches || !(event.target instanceof Element)) return;
    const openFrame = event.target.closest('[data-mobile-frame]:not([data-sidebar-collapsed])');
    const preview = openFrame?.querySelector(':scope > [data-mobile-role=center]');
    // Newer hosts keep the page inert while the sidebar owns keyboard focus.
    // Those taps land on the frame itself instead of the still-visible page.
    const bounds = preview && event.target === openFrame && event.detail > 0
      ? preview.getBoundingClientRect() : null;
    if (preview?.contains(event.target) || (bounds && event.clientX >= bounds.left &&
      event.clientX < bounds.right && event.clientY >= bounds.top && event.clientY < bounds.bottom)) {
      event.preventDefault();
      event.stopPropagation();
      layout.toggleSidebar();
      return;
    }
    const item = event.target.closest('button, a, [role="button"], [role="treeitem"]');
    if (item?.closest("[data-mobile-role=sidebar]")) {
      // A route can settle asynchronously. A boot-time render alone is not
      // navigation and must not close a drawer the user just opened.
      sidebarNavigationUntil = performance.now() + 5000;
    }
  }

  function onEscape(event) {
    if (event.defaultPrevented || event.key !== "Escape" || !media.matches || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
    const frame = document.querySelector("[data-mobile-frame]");
    if (!frame) return;
    if (rightOpen(frame)) layout.closeRightbar();
    else if (!frame.hasAttribute("data-sidebar-collapsed")) layout.toggleSidebar();
  }

  media.addEventListener("change", schedule);
  document.addEventListener("keydown", onEscape);
  document.addEventListener("click", onPhoneClick, true);
  observer.observe(document.getElementById("root") ?? document.body, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ["data-conversation-session", "data-sidebar-collapsed", "data-rightbar-collapsed", "data-rightbar-fullscreen", "contenteditable"]
  });
  sync();
  return () => {
    stopComposerFocus();
    stopViewport();
    observer.disconnect();
    if (pending) window.cancelAnimationFrame(pending);
    media.removeEventListener("change", schedule);
    document.removeEventListener("keydown", onEscape);
    document.removeEventListener("click", onPhoneClick, true);
    nav.remove();
    close.remove();
    previous?.frame.removeAttribute("data-dsh-phone-global-page");
    html.removeAttribute("data-dsh-phone");
  };
}
