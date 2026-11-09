import { startAuthentication, startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null
const value = (id: string) => get<HTMLInputElement>(id)?.value ?? ''
const prefix = '/_dsh_login'
const resumeKeys = !!document.querySelector('[data-resume-keys]')
const supports = browserSupportsWebAuthn()
const message = (text: string, success = false) => {
  const el = get('message')!
  el.toggleAttribute('data-success', success)
  el.textContent = text
}

class RequestError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}
async function post(path: string, payload: Record<string, unknown> = {}) {
  const r = await fetch(prefix + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin',
  })
  const j = await r.json()
  if (!r.ok) throw new RequestError(r.status, j.error || '请求失败，请重试。')
  return j
}

let busy = false
async function action(f: () => Promise<void>, button?: HTMLButtonElement) {
  if (busy) return
  busy = true
  if (button) button.disabled = true
  message('')
  try { await f() }
  catch (error) {
    message(error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError')
      ? '已取消或超时，请重试。' : error instanceof Error ? error.message : '操作未完成，请重试。')
  } finally {
    if (button) button.disabled = false
    busy = false
  }
}

function completeLogin(next: string) {
  location.replace(next === prefix + '/keys' ? next : '/')
}

const login = get<HTMLButtonElement>('passkey-login')
if (login) {
  const fallback = get<HTMLDetailsElement>('password-fallback')!
  if (!supports) {
    login.disabled = true
    fallback.open = true
    message('此浏览器不能使用 Passkey，请用账号密码。')
  }
  login.addEventListener('click', () => void action(async () => {
    try {
      const { id, options } = await post('/passkey/options')
      const credential = await startAuthentication({ optionsJSON: options })
      const { next } = await post('/passkey/verify', { id, credential, resumeKeys })
      completeLogin(next)
    } catch (error) {
      if (error instanceof RequestError && error.status === 409) fallback.open = true
      throw error
    }
  }, login))
}
get<HTMLFormElement>('password-form')?.addEventListener('submit', event => {
  event.preventDefault()
  void action(async () => {
    const { next } = await post('/password', { username: value('username'), password: value('password'), resumeKeys })
    completeLogin(next)
  }, (event as SubmitEvent).submitter as HTMLButtonElement | undefined)
})

const back = get<HTMLAnchorElement>('back-app')
if (back) back.addEventListener('click', event => {
  if (event.button || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  event.preventDefault()
  const referrer = document.referrer ? new URL(document.referrer) : null
  if (new URLSearchParams(location.search).get('from') === 'settings' && referrer?.origin === location.origin &&
    !referrer.pathname.startsWith(prefix) && history.length > 1) history.back()
  else location.replace('/')
})

type KeyItem = { id: string; label: string; created: number }
const panel = get('key-action')
const password = get<HTMLInputElement>('key-password')
const submit = get<HTMLButtonElement>('add-key')
let removing: KeyItem | undefined
let opener: HTMLButtonElement | undefined
function closePanel(restoreFocus: boolean) {
  if (panel) panel.hidden = true
  get<HTMLFormElement>('key-form')?.reset()
  if (restoreFocus && opener?.isConnected && !opener.disabled) opener.focus()
  opener = undefined
  removing = undefined
}
function openPanel(button: HTMLButtonElement, key?: KeyItem) {
  if (!panel || busy) return
  closePanel(false)
  message('')
  opener = button
  removing = key
  get('action-title')!.textContent = key ? '移除 ' + key.label : '添加 Passkey'
  get('action-detail')!.textContent = key ? '此 Passkey 将无法再登录，使用它的会话也会退出。' : '确认当前密码，然后按设备提示完成验证。'
  get('key-label-field')!.hidden = !!key
  submit!.textContent = key ? '确认移除' : '继续'
  panel.hidden = false
  panel.scrollIntoView({ block: 'nearest' })
  get('action-title')!.tabIndex = -1
  get('action-title')!.focus({ preventScroll: true })
}

async function list() {
  const out = get<HTMLUListElement>('keys')
  if (!out) return
  const { keys, max } = await post('/keys/list') as { keys: KeyItem[]; max: number }
  get('key-count')!.textContent = keys.length + ' / ' + max
  get('key-empty')!.hidden = keys.length > 0
  get('key-limit')!.hidden = keys.length < max
  const add = get<HTMLButtonElement>('show-add')!
  add.disabled = keys.length >= max || !supports
  if (!supports) message('此浏览器不能添加 Passkey，请使用支持 Passkey 的浏览器。')
  out.replaceChildren()
  for (const key of keys) {
    const li = document.createElement('li')
    li.className = 'row'
    const label = document.createElement('div')
    const name = document.createElement('strong')
    const date = document.createElement('small')
    name.textContent = key.label
    date.textContent = '添加于 ' + new Date(key.created).toLocaleDateString()
    label.append(name, date)
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'danger'
    remove.textContent = '移除'
    remove.setAttribute('aria-label', '移除 ' + key.label)
    remove.addEventListener('click', () => openPanel(remove, key))
    li.append(label, remove)
    out.append(li)
  }
}
get<HTMLButtonElement>('show-add')?.addEventListener('click', event => openPanel(event.currentTarget as HTMLButtonElement))
get('cancel-action')?.addEventListener('click', () => { if (!busy) closePanel(true) })
get<HTMLFormElement>('key-form')?.addEventListener('submit', event => {
  event.preventDefault()
  void action(async () => {
    const key = removing
    if (key) {
      const { reauthenticate } = await post('/keys/remove', { id: key.id, password: password!.value })
      if (reauthenticate) {
        location.replace(prefix + '?continue=keys&removed=1')
        return
      }
    } else {
      const { id, options } = await post('/keys/options', { password: password!.value, label: value('key-label') })
      const credential = await startRegistration({ optionsJSON: options })
      await post('/keys/verify', { id, credential })
    }
    closePanel(false)
    await list()
    message(key ? '已移除 Passkey。' : 'Passkey 已添加，可以返回 DSH。', true)
    const focus = get('registered')!
    focus.tabIndex = -1
    focus.focus({ preventScroll: true })
  }, submit ?? undefined)
})
get<HTMLButtonElement>('logout')?.addEventListener('click', event => {
  if (!confirm('退出当前设备的 DSH 登录？')) return
  void action(async () => {
    await post('/logout')
    location.replace(prefix)
  }, event.currentTarget as HTMLButtonElement)
})
if (get('keys')) void action(list)
if (resumeKeys && new URLSearchParams(location.search).get('removed') === '1') {
  message('已移除当前使用的 Passkey，请重新登录。', true)
}
