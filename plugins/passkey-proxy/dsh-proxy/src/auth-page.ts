const css = `
  :root {
    color-scheme: light dark; font:16px system-ui,sans-serif;
    --bg:#f5f6f8; --surface:#fff; --soft:#eef1f6; --line:#d9dee7;
    --ink:#1a1d24; --muted:#555e6e; --accent:#284fb8; --fill:#345cc7; --danger:#a82632; --good:#20704c;
    color:var(--ink); background:var(--bg);
  }
  @media(prefers-color-scheme:dark){:root{
    --bg:#17181b; --surface:#202227; --soft:#282b32; --line:#3a3e48;
    --ink:#f2f3f6; --muted:#b0b6c3; --accent:#a0b9ff; --fill:#355cc7; --danger:#ff9aa3; --good:#84d8ae;
  }}
  *{box-sizing:border-box}
  [hidden]{display:none!important}
  body{margin:0;min-height:100svh;padding:max(24px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
  main{max-width:480px;margin:clamp(8px,6vh,64px) auto 0}
  main.login{max-width:416px}
  header{margin:12px 0 20px}
  h1{font-size:clamp(1.65rem,6vw,2rem);line-height:1.2;margin:12px 0 8px;letter-spacing:-.025em}
  h2{font-size:1.07rem;margin:0}p{line-height:1.55;margin:0;color:var(--muted)}
  .icon{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;color:var(--accent);background:var(--soft)}
  .icon svg{width:23px;height:23px}
  .card{padding:clamp(14px,4vw,22px);background:var(--surface);border:1px solid var(--line);border-radius:18px}
  .card+.card{margin-top:12px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
  .count{font-size:.875rem;font-variant-numeric:tabular-nums;color:var(--muted);white-space:nowrap}
  .empty{padding:16px 0 12px}
  label{display:block;font-weight:600;margin:12px 0 6px}
  input,button{font:inherit;min-height:44px;border-radius:10px;padding:8px 12px}
  input{width:100%;min-width:0;border:1px solid var(--line);background:var(--bg);color:var(--ink)}
  button{cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--ink)}
  button.primary{background:var(--fill);border-color:transparent;color:#fff;font-weight:650}
  .full{width:100%}
  button:disabled{opacity:.5;cursor:default}
  a, summary, button.link{color:var(--accent)}
  a:focus-visible,button:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
  a.back,summary,.link{display:inline-flex;align-items:center;min-height:44px}
  a.back{text-decoration:none;gap:7px;font-weight:600}
  a.back svg{width:18px;height:18px}
  summary{cursor:pointer}
  details[open] summary{margin-bottom:4px}
  details{margin-top:8px}
  form>.primary{margin-top:16px}
  #keys{margin:4px 0 12px;padding:0;list-style:none}
  #keys:empty{margin:0}
  #keys li{padding:10px 0;border-bottom:1px solid var(--line)}
  #keys li div{min-width:0}
  #keys strong,#keys small{display:block;overflow-wrap:anywhere}
  #keys small{color:var(--muted);margin-top:4px}
  button.danger,button.link.danger{color:var(--danger)}
  button.link{padding:8px 4px;border:0;background:transparent}
  .form-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
  #message:not(:empty){margin-top:14px;color:var(--danger);overflow-wrap:anywhere}
  #message[data-success]{color:var(--good)}
  footer{margin-top:10px;display:flex;justify-content:flex-end}
`

const keyIcon = '<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15.5" r="4.2"/><path d="m11 12.5 8-8 2 2-1.6 1.6M16.1 7.4l2 2"/></svg></span>'

export function authPage(management: boolean, passkey: boolean, resumeKeys = false, allowPassword = true,
  httpsOrigin?: string, untrustedExternal = false): string {
  const password = `<form id="password-form" method="post"><label for="username">账号</label>
    <input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="256">
    <label for="password">密码</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024">
    <button class="primary full" type="submit">登录</button></form>`
  const login = passkey
    ? '<button class="primary full" type="button" id="passkey-login">使用 Passkey 登录</button>' +
      (allowPassword ? '<details id="password-fallback"><summary>改用账号密码</summary>' + password + '</details>' : '')
    : allowPassword ? password
    : untrustedExternal ? '<p>这个 HTTPS 入口还未通过反代来源检查。请在服务器上的 DSH 设置中核对来源 IP 和转发协议。</p>'
    : httpsOrigin ? `<p>此入口不接受密码登录。请从 <a href="${httpsOrigin}/">HTTPS 入口</a> 使用 Passkey。</p>`
    : '<p>代理还没有可用的登录方式。请在服务器上打开原来的 DSH 页面，先配置代理账号和密码。</p>'
  const keys = passkey ? `<section class="card" aria-labelledby="registered">
    <div class="row"><h2 id="registered">已添加的 Passkey</h2><span id="key-count" class="count" aria-live="polite"></span></div>
    <p id="key-empty" class="empty" hidden>还没有 Passkey。添加后，下次可以用设备上的 Face ID、指纹或屏幕锁登录。</p>
    <ul id="keys"></ul>
    <button class="primary full" id="show-add" type="button" disabled>添加 Passkey</button>
    <p id="key-limit" class="empty" hidden>已达到 5 个。先移除一个，再添加新的。</p>
    </section>
    <section id="key-action" class="card" aria-labelledby="action-title" hidden>
      <h2 id="action-title"></h2>
      <p id="action-detail"></p>
      <form id="key-form" method="post">
        <div id="key-label-field"><label for="key-label">设备名称（可选）</label><input id="key-label" placeholder="例如：我的 iPhone" maxlength="60"></div>
        <label for="key-password">管理验证密码</label><input id="key-password" type="password" autocomplete="current-password" required maxlength="1024">
        <div class="form-actions"><button class="primary" id="add-key" type="submit">继续</button><button id="cancel-action" type="button">取消</button></div>
      </form>
    </section>` : '<section class="card"><p>此地址可以用账号密码登录。请从管理员配置的 HTTPS 域名打开此页，才能管理 Passkey。</p></section>'
  const back = '<a class="back" id="back-app" href="/"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 6-6 6 6 6"/></svg>返回 DSH</a>'
  const title = management ? '管理 Passkey' : '登录 DeepSeek Harness'
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>${title} · DSH</title><style>${css}</style></head>
    <body><main class="${management ? 'management' : 'login'}"${resumeKeys ? ' data-resume-keys' : ''}>
    ${management ? back : ''}
    <header>${keyIcon}<h1>${title}</h1><p>${management ? '使用设备验证登录。每个账号最多添加 5 个。' : passkey
      ? allowPassword ? '已有 Passkey 可直接登录。首次设置请先用账号密码。' : '使用已添加的 Passkey 登录。'
      : allowPassword ? '请输入局域网代理的账号密码。' : '这里暂时没有可用的登录方式。'}</p></header>
    ${management ? keys : '<section class="card">' + login + '</section>'}
    <p id="message" role="status" aria-live="polite"></p>
    ${management ? '<footer><button class="link danger" type="button" id="logout">退出登录</button></footer>' : ''}
    </main><script src="/_dsh_login/client.js" defer></script></body></html>`
}
