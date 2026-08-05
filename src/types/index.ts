export type ProfitType = 'oplata' | 'perevod' | 'iks' | 'vozvrat' | 'vozvrat_yurist'

export interface VKAccount {
  login: string
  password: string
  token?: string
  userAgent?: string
}

// Apple ID ready-to-purchase account (for premium on anketa cities)
export interface AppleIdEntry {
  email: string
  password: string
  mailPassword?: string // password of the mail account
  smsLink?: string      // link to fetch the SMS code
}

// A tracked work session started/stopped by the user.
export interface SessionRecord {
  id: string
  endedAt: string        // ISO timestamp
  durationMs: number     // how long the session ran
  profitDeltaRub: number // profit earned during the session
}

// Live state of the running stopwatch.
export interface SessionTimer {
  running: boolean
  startedAt: number | null   // epoch ms
  profitRubAtStart: number   // total profit (RUB) when the session started
}

export interface CityEntry {
  id: string
  city: string
  status: 'active' | 'blocked'
  vk?: VKAccount
  appleId?: AppleIdEntry
}

export interface Anketa {
  id: string
  workerId: string
  name: string
  age?: number
  telegram?: string
  cities: CityEntry[]
  birthDates: string[]
  notes?: string
  photos: string[]   // base64
  videos: string[]   // filenames (future: cloud)
  createdAt: string
  updatedAt: string
}

export interface Worker {
  id: string
  name: string
  emoji: string
  avatarUrl?: string
  totalProfit: number   // in RUB
  createdAt: string
}

export interface ProfitEntry {
  id: string
  workerId: string
  anketaId?: string
  amount: number        // RUB input
  type: ProfitType
  myShare: number       // RUB
  note?: string
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  emoji: string
  targetAmount: number  // USD
  savedAmount: number   // USD
  color: string
  imageUrl?: string
  imagePosition?: string
  description?: string
}

export interface Settings {
  rubToUsd: number      // e.g. 90
  usdToUah: number      // e.g. 43.70
  language: 'en' | 'uk'
}

export interface UserProfile {
  name: string
  level: number
  xp: number
  totalEarned: number   // RUB
  goals: Goal[]
  settings: Settings
  workerAvatars?: Record<string, string>  // workerId -> URL
  appleIds?: AppleIdEntry[]  // Available Apple IDs (ready to purchase / premium)
}

export const PROFIT_LABELS: Record<ProfitType, string> = {
  oplata: 'Оплата',
  perevod: 'Прямой перевод',
  iks: 'Х / вторая оплата',
  vozvrat: 'Возврат',
  vozvrat_yurist: 'Возврат с юристом',
}

export const PROFIT_PERCENTS: Record<ProfitType, number> = {
  oplata: 0.70,
  perevod: 0.70,
  iks: 0.70,
  vozvrat: 0.45,
  vozvrat_yurist: 0.40,
}

export function calcMyShare(amount: number, type: ProfitType): number {
  return amount * PROFIT_PERCENTS[type] * 0.5
}

export function rubToUsd(rub: number, rate: number): number {
  return rub / rate
}

export function usdToUah(usd: number, rate: number): number {
  return usd * rate
}

export function fmtUsd(usd: number): string {
  return '$' + usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function fmtUah(uah: number): string {
  return uah.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ₴'
}

export function fmtRub(rub: number): string {
  return rub.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽'
}

// Level N requires N*1000 UAH to complete (1→2: 1k, 2→3: 2k, etc.)
export function getLevelInfo(totalUah: number): { level: number; progress: number; currentXp: number; neededXp: number } {
  let level = 1
  let cumulative = 0
  while (true) {
    const needed = level * 1000
    if (cumulative + needed > totalUah) {
      const current = Math.floor(totalUah - cumulative)
      return { level, progress: current / needed, currentXp: current, neededXp: needed }
    }
    cumulative += needed
    level++
  }
}

// Parse VK account list: "ID:password:token:useragent" per line
export function parseVkList(raw: string): VKAccount[] {
  return raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.includes(':'))
    .map(line => {
      const parts = line.split(':')
      return {
        login: parts[0].trim(),
        password: parts[1].trim(),
        token: parts[2]?.trim() || undefined,
        userAgent: parts.length > 3 ? parts.slice(3).join(':').trim() : undefined,
      }
    })
    .filter(a => a.login && a.password)
}

// Parse a pasted block of Apple ID accounts (ready to purchase)
// Accepts "Почта: ... / Пароль: ..." lines and optional card/phone/mail password/sms link.
export function parseAppleIds(raw: string): AppleIdEntry[] {
  const blocks = raw
    .split(/\n\s*\n|\n(?=\d+\s*$)/)
    .map(b => b.trim())
    .filter(Boolean)

  const accounts: AppleIdEntry[] = []

  // Try to split on visible numeric index markers ("1", "\n2\n", "---" separators)
  const splitBlocks = blocks.length === 1
    ? raw.split(/\n\s*(?=\d+\s*\n)/).filter(b => b.trim())
    : blocks

  for (const block of splitBlocks) {
    const get = (label: string) => {
      const m = block.match(new RegExp(label + '\\s*[:：][ \\t]*([^\\n\\r]+)', 'i'))
      return m ? m[1].trim() : undefined
    }

    const email = get('Почта') || get('Email')
    const password = get('Пароль')
    if (!email || !password) continue

    const smsMatch = block.match(/https?:\/\/\S+/)
    const account: AppleIdEntry = {
      email,
      password,
      mailPassword: get('Пароль от почты') || get('Пароль пошти') || get('Mail password'),
      smsLink: smsMatch ? smsMatch[0].replace(/[),;]+$/, '') : undefined,
    }
    accounts.push(account)
  }

  return accounts
}
