export type ProfitType = 'oplata' | 'perevod' | 'iks' | 'vozvrat' | 'vozvrat_yurist'

export interface VKAccount {
  login: string
  password: string
  token?: string
  userAgent?: string
}

export interface CityEntry {
  id: string
  city: string
  status: 'active' | 'blocked'
  vk?: VKAccount
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
  description?: string
}

export interface Settings {
  rubToUsd: number      // e.g. 90
  usdToUah: number      // e.g. 43.70
}

export interface UserProfile {
  name: string
  level: number
  xp: number
  totalEarned: number   // RUB
  goals: Goal[]
  settings: Settings
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
