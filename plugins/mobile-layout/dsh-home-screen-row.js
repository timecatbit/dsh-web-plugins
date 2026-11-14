// Settings → General row: the icon a phone gets when DSH is added to its home
// screen. The value is the host part's live `homeScreenIcon` Config field,
// read and written through DSH's shared settings forms (`configForms`), so it
// is stored in the DSH profile and applies without a restart.
const dshHomeScreenEntry = "dsh-ui-mobile";
const dshHomeScreenNs = "dsh-ui-mobile";
const dshHomeScreenChoices = ["dsh", "black", "white"];
const dshHomeScreenCopy = {
  zh: {
    "homeIcon.title": "主屏幕图标",
    "homeIcon.hint": "手机把 DSH 添加到主屏幕时用的图标。更换后，先删掉桌面上原来的图标，再从浏览器重新添加。",
    "homeIcon.dsh": "DSH 自带",
    "homeIcon.black": "黑底白鲸",
    "homeIcon.white": "白底黑鲸",
  },
  en: {
    "homeIcon.title": "Home-screen icon",
    "homeIcon.hint": "The icon a phone uses when DSH is added to its home screen. After changing it, remove the old icon from the home screen and add DSH again from the browser.",
    "homeIcon.dsh": "DSH's own",
    "homeIcon.black": "White on black",
    "homeIcon.white": "Black on white",
  },
};
const dshHomeScreenCss = `
.dsh_home_icon_group{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:8px;padding:16px 0;display:flex}
.dsh_home_icon_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}
.dsh_home_icon_hint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin-top:-4px}
.dsh_home_icon_row{flex-wrap:wrap;align-items:stretch;gap:8px;display:flex}
.dsh_home_icon_choice{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-xl);font:inherit;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;flex:180px;flex-direction:column;justify-content:center;align-items:center;gap:8px;padding:16px 24px;font-size:14px;line-height:22px;display:flex}
.dsh_home_icon_choice:disabled{cursor:default;opacity:.6}
@media (hover:hover){.dsh_home_icon_choice:hover:not(.dsh_home_icon_selected):not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}}
.dsh_home_icon_selected{background:var(--dsw-alias-bg-module-platform);border-color:var(--dsw-alias-border-selected)}
.dsh_home_icon_thumb{width:44px;height:44px;border-radius:10px;box-shadow:0 0 0 .5px var(--dsw-alias-border-l4);object-fit:cover;background:var(--dsw-alias-bg-module-platform)}
@media (width<=767px){.dsh_home_icon_choice{flex:1 1 0;min-width:0;padding:12px 6px;font-size:13px;line-height:18px;text-align:center}.dsh_home_icon_thumb{width:40px;height:40px;border-radius:9px}}
`;

function dshHomeScreenThumb(choice) {
  return choice === "dsh" ? "/apple-touch-icon.png" : `/home-screen/${choice}/apple-touch-icon.png`;
}

function DshHomeScreenRow({ t, form }) {
  const snapshot = react.useSyncExternalStore((listener) => form.subscribe(listener), () => form.getSnapshot());
  if (snapshot.status === "unavailable") return null;
  const value = snapshot.value?.homeScreenIcon;
  const current = dshHomeScreenChoices.includes(value) ? value : "dsh";
  const disabled = snapshot.status !== "ready" || !snapshot.writable;
  const h = react.createElement;
  return h("div", { className: "dsh_home_icon_group", "data-dsh-home-icon": current },
    h("div", { className: "dsh_home_icon_title" }, t("homeIcon.title")),
    h("div", { className: "dsh_home_icon_hint" }, t("homeIcon.hint")),
    h("div", { className: "dsh_home_icon_row", role: "radiogroup", "aria-label": t("homeIcon.title") },
      dshHomeScreenChoices.map((choice) => h("button", {
        key: choice,
        type: "button",
        role: "radio",
        "aria-checked": current === choice,
        "data-choice": choice,
        disabled,
        className: current === choice ? "dsh_home_icon_choice dsh_home_icon_selected" : "dsh_home_icon_choice",
        onClick: () => { if (choice !== current) void form.set("homeScreenIcon", choice); },
      },
        h("img", {
          className: "dsh_home_icon_thumb",
          src: dshHomeScreenThumb(choice),
          alt: "",
          // DSH 0.2.1-rc.5 ships no PNG icon; show its favicon instead.
          onError: (event) => { if (choice === "dsh" && !event.currentTarget.src.endsWith("/favicon.svg")) event.currentTarget.src = "/favicon.svg"; },
        }),
        t(`homeIcon.${choice}`))))
  );
}

function installHomeScreenRow(ctx) {
  // Optional: a host without shared settings forms or a General page simply
  // shows no row; the rest of Pocket UI keeps working.
  ctx.inject(["configForms", "locale"], (child) => {
    child.effect(() => child.locale.register(dshHomeScreenNs, dshHomeScreenCopy), "ui-mobile: home-screen icon copy");
    child.effect(() => {
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-ui-mobile";
      tag.dataset.pluginCss = "dsh-ui-mobile/home-screen-row";
      tag.textContent = dshHomeScreenCss;
      document.head.appendChild(tag);
      return () => tag.remove();
    }, "ui-mobile: home-screen icon styles");
    const form = child.configForms.get(dshHomeScreenEntry);
    child.slots.inject("settings.general.item", () => child.slots.register({
      name: "settings.general.item",
      id: "dsh-ui-mobile-home-screen-icon",
      order: 12,
      locale: dshHomeScreenNs,
      inject: () => ({ form }),
    }, DshHomeScreenRow));
  });
}
