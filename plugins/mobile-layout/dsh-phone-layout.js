function installPhoneLayout(layout) {
  const html = document.documentElement;
  const media = window.matchMedia(MOBILE_QUERY$2);
  const viewport = window.visualViewport;
  const observer = new MutationObserver(schedule);
  const nav = document.createElement("button");
  nav.type = "button";
  nav.dataset.dshPhoneNav = "";
  nav.setAttribute("aria-label", "菜单");
  nav.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  nav.addEventListener("click", () => layout.toggleSidebar());
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
    const normalScale = viewport && Math.abs(viewport.scale - 1) < 0.05;
    const active = document.activeElement;
    const editable = active?.matches?.('input, textarea, [contenteditable="true"]');
    const keyboard = phone && normalScale && editable && window.innerHeight - viewport.height > 105;
    html.toggleAttribute("data-dsh-phone-keyboard", !!keyboard);
    if (phone && normalScale && viewport.height > 0) {
      html.style.setProperty("--dsh-phone-height", Math.round(viewport.height) + "px");
      html.style.setProperty("--dsh-phone-top", Math.max(0, Math.round(viewport.offsetTop)) + "px");
    } else {
      html.style.removeProperty("--dsh-phone-height");
      html.style.removeProperty("--dsh-phone-top");
    }

    const frame = document.querySelector("[data-mobile-frame]");
    const center = frame?.querySelector(":scope > [data-mobile-role=center]");
    if (!phone || !center) {
      if (nav.isConnected) nav.remove();
      previous?.frame.removeAttribute("data-dsh-phone-global-page");
      previous = undefined;
      return;
    }
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
    const needsNav = !center.querySelector("[data-conversation-header-leading] .x8foHq_button");
    frame.toggleAttribute("data-dsh-phone-global-page", needsNav);
    nav.hidden = !needsNav;
    nav.setAttribute("aria-expanded", String(!frame.hasAttribute("data-sidebar-collapsed")));
    if (nav.parentElement !== frame) frame.appendChild(nav);
    for (const editor of center.querySelectorAll('[data-composer-card] [contenteditable="true"]')) {
      if (editor.getAttribute("enterkeyhint") !== "send") editor.setAttribute("enterkeyhint", "send");
    }
  }

  function rightOpen(frame) {
    return frame.hasAttribute("data-rightbar-fullscreen") || !frame.hasAttribute("data-rightbar-collapsed");
  }

  function onSidebarClick(event) {
    if (!media.matches || !(event.target instanceof Element)) return;
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
  viewport?.addEventListener("resize", schedule);
  viewport?.addEventListener("scroll", schedule);
  for (const event of ["resize", "pageshow", "orientationchange"]) window.addEventListener(event, schedule);
  document.addEventListener("focusin", schedule);
  document.addEventListener("focusout", schedule);
  document.addEventListener("keydown", onEscape);
  document.addEventListener("click", onSidebarClick, true);
  observer.observe(document.getElementById("root") ?? document.body, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ["data-conversation-session", "data-sidebar-collapsed", "data-rightbar-collapsed", "data-rightbar-fullscreen", "contenteditable"]
  });
  sync();
  return () => {
    observer.disconnect();
    if (pending) window.cancelAnimationFrame(pending);
    media.removeEventListener("change", schedule);
    viewport?.removeEventListener("resize", schedule);
    viewport?.removeEventListener("scroll", schedule);
    for (const event of ["resize", "pageshow", "orientationchange"]) window.removeEventListener(event, schedule);
    document.removeEventListener("focusin", schedule);
    document.removeEventListener("focusout", schedule);
    document.removeEventListener("keydown", onEscape);
    document.removeEventListener("click", onSidebarClick, true);
    nav.remove();
    previous?.frame.removeAttribute("data-dsh-phone-global-page");
    html.removeAttribute("data-dsh-phone");
    html.removeAttribute("data-dsh-phone-keyboard");
    html.style.removeProperty("--dsh-phone-height");
    html.style.removeProperty("--dsh-phone-top");
  };
}
