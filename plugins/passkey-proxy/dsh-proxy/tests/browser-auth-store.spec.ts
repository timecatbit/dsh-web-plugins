import { afterEach, describe, expect, it } from 'vitest'
import { chmodSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BrowserAuth } from '../src/browser-auth.ts'

/**
 * The sign-in store (sessions, Passkeys, signing secret) must survive a DSH restart. Windows reports every file
 * as mode 0o666, so a Unix-only "nobody else can read it" check refused the store on the second start and the
 * proxy had no sign-in page any more (found on a Windows 11 test machine, 2026-11-25).
 */
const realPlatform = process.platform
const setPlatform = (value: string): void => { Object.defineProperty(process, 'platform', { value, configurable: true }) }
afterEach(() => setPlatform(realPlatform))

const store = (): string => join(mkdtempSync(join(tmpdir(), 'dsh-proxy-auth-')), 'dsh-proxy-auth.json')
const secretOf = (file: string): string => JSON.parse(readFileSync(file, 'utf8')).secret

describe('BrowserAuth store across restarts', () => {
  it('reuses the store written by the first start', () => {
    const file = store()
    new BrowserAuth(file, 'u', 'p')
    const secret = secretOf(file)
    new BrowserAuth(file, 'u', 'p')
    expect(secretOf(file)).toBe(secret)
  })

  it.skipIf(realPlatform === 'win32')('refuses a store others can read on Unix', () => {
    const file = store()
    new BrowserAuth(file, 'u', 'p')
    chmodSync(file, 0o644)
    expect(() => new BrowserAuth(file, 'u', 'p')).toThrow(/private regular file/)
  })

  it('accepts the store on Windows, where files always report mode 0o666', () => {
    const file = store()
    new BrowserAuth(file, 'u', 'p')
    const secret = secretOf(file)
    if (realPlatform !== 'win32') chmodSync(file, 0o666)
    setPlatform('win32')
    expect(() => new BrowserAuth(file, 'u', 'p')).not.toThrow()
    expect(secretOf(file)).toBe(secret)
  })
})
