import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import {
  Worker, Anketa, ProfitEntry, UserProfile, Goal,
  CityEntry, VKAccount, calcMyShare, ProfitType, parseVkList
} from '@/types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const DEFAULT_SETTINGS = { rubToUsd: 90, usdToUah: 43.70, language: 'en' as const }

const DEFAULT_GOALS = [
  {
    id: 'goal-iphone',
    title: 'iPhone 17 Pro Max',
    emoji: '📱',
    targetAmount: 1300,
    savedAmount: 0,
    color: '#7c5cfc',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    description: 'iPhone 17 Pro Max · 256GB',
  },
  {
    id: 'goal-bmw',
    title: 'BMW 328 Xi 2015',
    emoji: '🚗',
    targetAmount: 5500,
    savedAmount: 0,
    color: '#60a5fa',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
    description: '2015 · 67 093 км · 2.0л · $5,500',
  },
  {
    id: 'goal-apt',
    title: '2-комн. квартира',
    emoji: '🏠',
    targetAmount: 45000,
    savedAmount: 0,
    color: '#22d3a5',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    description: 'Ивано-Франковск · 2 комнаты',
  },
  {
    id: 'goal-angelina',
    title: 'Ангелина 💕',
    emoji: '💕',
    targetAmount: 10000,
    savedAmount: 0,
    color: '#f472b6',
    imageUrl: 'https://i.postimg.cc/CLGnK9W0/photo-2026-04-06-03-06-26.jpg',
    description: 'Цель мечты',
  },
]

const DEFAULT_PROFILE: UserProfile = {
  name: 'Crowley',
  level: 1,
  xp: 0,
  totalEarned: 0,
  goals: DEFAULT_GOALS,
  settings: DEFAULT_SETTINGS,
}

interface AppState {
  workers: Worker[]
  anketas: Anketa[]
  profits: ProfitEntry[]
  profile: UserProfile
  initialized: boolean

  initialize: () => Promise<void>

  addWorker: (name: string, emoji: string) => Promise<Worker>
  updateWorker: (id: string, updates: Partial<Pick<Worker, 'name' | 'emoji'>>) => Promise<void>
  deleteWorker: (id: string) => Promise<void>

  addAnketa: (data: Omit<Anketa, 'id' | 'createdAt' | 'updatedAt' | 'photos' | 'videos'>) => Promise<void>
  updateAnketa: (id: string, updates: Partial<Anketa>) => Promise<void>
  deleteAnketa: (id: string) => Promise<void>

  assignVkToAnketa: (anketaId: string, rawList: string) => Promise<string>
  setVkForCity: (anketaId: string, cityId: string, login: string, password: string) => Promise<void>
  removeVkFromCity: (anketaId: string, cityId: string) => Promise<void>

  addProfit: (workerId: string, amount: number, type: ProfitType, note?: string, anketaId?: string) => Promise<void>
  deleteProfit: (id: string) => Promise<void>

  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  addToGoal: (id: string, amount: number) => Promise<void>

  updateSettings: (s: Partial<UserProfile['settings']>) => Promise<void>
}

// Save profile to Supabase (single row, id=1)
async function saveProfile(profile: UserProfile) {
  await supabase.from('profile').upsert({
    id: 1,
    name: profile.name,
    level: profile.level,
    xp: profile.xp,
    total_earned: profile.totalEarned,
    goals: profile.goals,
    settings: profile.settings,
  })
}

export const useStore = create<AppState>()((set, get) => ({
  workers: [],
  anketas: [],
  profits: [],
  profile: DEFAULT_PROFILE,
  initialized: false,

  // ── Load all data from Supabase ──────────────────────────────────────
  initialize: async () => {
    try {
    const [
      { data: workers },
      { data: anketas },
      { data: profits },
      { data: profileRows },
    ] = await Promise.all([
      supabase.from('workers').select('*').order('created_at', { ascending: false }),
      supabase.from('anketas').select('*').order('created_at', { ascending: false }),
      supabase.from('profits').select('*').order('created_at', { ascending: false }),
      supabase.from('profile').select('*').eq('id', 1),
    ])

    const p = profileRows?.[0]
    const profile: UserProfile = p ? {
      name: p.name,
      level: p.level,
      xp: p.xp,
      totalEarned: p.total_earned,
      goals: p.goals ?? [],
      settings: p.settings ?? DEFAULT_SETTINGS,
    } : DEFAULT_PROFILE

    // If no profile row yet, create it. If goals empty, seed defaults.
    if (!p) {
      await saveProfile(DEFAULT_PROFILE)
    } else if (profile.goals.length === 0) {
      profile.goals = DEFAULT_GOALS
      await saveProfile(profile)
    } else {
      // Always sync imageUrl/description from DEFAULT_GOALS (in case they were updated)
      let patched = false
      profile.goals = profile.goals.map(g => {
        const def = DEFAULT_GOALS.find(d => d.id === g.id)
        if (def && g.imageUrl !== def.imageUrl) {
          patched = true
          return { ...g, imageUrl: def.imageUrl }
        }
        return g
      })
      if (patched) await saveProfile(profile)
    }

    set({
      initialized: true,
      workers: (workers ?? []).map(w => ({
        id: w.id, name: w.name, emoji: w.emoji,
        totalProfit: w.total_profit, createdAt: w.created_at,
      })),
      anketas: (anketas ?? []).map(a => ({
        id: a.id, workerId: a.worker_id, name: a.name,
        age: a.age, telegram: a.telegram,
        cities: a.cities ?? [],
        birthDates: a.birth_dates ?? [],
        notes: a.notes, photos: a.photos ?? [], videos: a.videos ?? [],
        createdAt: a.created_at, updatedAt: a.updated_at,
      })),
      profits: (profits ?? []).map(p => ({
        id: p.id, workerId: p.worker_id, anketaId: p.anketa_id,
        amount: p.amount, type: p.type, myShare: p.my_share,
        note: p.note, createdAt: p.created_at,
      })),
      profile,
    })
    } catch (e) {
      console.error('Supabase init error:', e)
      set({ initialized: true })
    }
  },

  // ── Workers ─────────────────────────────────────────────────────────
  addWorker: async (name, emoji) => {
    const worker: Worker = {
      id: uid(), name, emoji, totalProfit: 0, createdAt: new Date().toISOString(),
    }
    set(s => ({ workers: [worker, ...s.workers] }))
    await supabase.from('workers').insert({
      id: worker.id, name, emoji, total_profit: 0, created_at: worker.createdAt,
    })
    return worker
  },

  updateWorker: async (id, updates) => {
    set(s => ({ workers: s.workers.map(w => w.id === id ? { ...w, ...updates } : w) }))
    await supabase.from('workers').update(updates).eq('id', id)
  },

  deleteWorker: async (id) => {
    set(s => ({
      workers: s.workers.filter(w => w.id !== id),
      anketas: s.anketas.filter(a => a.workerId !== id),
      profits: s.profits.filter(p => p.workerId !== id),
    }))
    await supabase.from('workers').delete().eq('id', id)
  },

  // ── Anketas ──────────────────────────────────────────────────────────
  addAnketa: async (data) => {
    const anketa: Anketa = {
      ...data, id: uid(), photos: [], videos: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    set(s => ({ anketas: [anketa, ...s.anketas] }))
    await supabase.from('anketas').insert({
      id: anketa.id, worker_id: anketa.workerId, name: anketa.name,
      age: anketa.age, telegram: anketa.telegram,
      cities: anketa.cities, birth_dates: anketa.birthDates,
      notes: anketa.notes, photos: [], videos: [],
      created_at: anketa.createdAt, updated_at: anketa.updatedAt,
    })
  },

  updateAnketa: async (id, updates) => {
    set(s => ({
      anketas: s.anketas.map(a =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    }))
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.age !== undefined) dbUpdates.age = updates.age
    if (updates.telegram !== undefined) dbUpdates.telegram = updates.telegram
    if (updates.cities !== undefined) dbUpdates.cities = updates.cities
    if (updates.birthDates !== undefined) dbUpdates.birth_dates = updates.birthDates
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.photos !== undefined) dbUpdates.photos = updates.photos
    await supabase.from('anketas').update(dbUpdates).eq('id', id)
  },

  deleteAnketa: async (id) => {
    set(s => ({ anketas: s.anketas.filter(a => a.id !== id) }))
    await supabase.from('anketas').delete().eq('id', id)
  },

  // ── VK assign ────────────────────────────────────────────────────────
  assignVkToAnketa: async (anketaId, rawList) => {
    const accounts: VKAccount[] = parseVkList(rawList)
    if (accounts.length === 0) return 'Не удалось распознать аккаунты'
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return 'Анкета не найдена'
    const freeCities = anketa.cities.filter(c => !c.vk)
    if (freeCities.length === 0) return 'Все города уже имеют ВК аккаунты'
    const shuffled = [...accounts].sort(() => Math.random() - 0.5)
    const toAssign = shuffled.slice(0, freeCities.length)
    const updatedCities: CityEntry[] = anketa.cities.map(city => {
      if (city.vk) return city
      const acc = toAssign.shift()
      return acc ? { ...city, vk: acc } : city
    })
    await get().updateAnketa(anketaId, { cities: updatedCities })
    const assigned = updatedCities.filter(c => c.vk).length - anketa.cities.filter(c => c.vk).length
    return `Привязано ${assigned} аккаунтов`
  },

  setVkForCity: async (anketaId, cityId, login, password) => {
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return
    const updatedCities = anketa.cities.map(c =>
      c.id === cityId ? { ...c, vk: { login, password } } : c
    )
    await get().updateAnketa(anketaId, { cities: updatedCities })
  },

  removeVkFromCity: async (anketaId, cityId) => {
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return
    const updatedCities = anketa.cities.map(c => c.id === cityId ? { ...c, vk: undefined } : c)
    await get().updateAnketa(anketaId, { cities: updatedCities })
  },

  // ── Profits ──────────────────────────────────────────────────────────
  addProfit: async (workerId, amount, type, note, anketaId) => {
    const myShare = calcMyShare(amount, type)
    const entry: ProfitEntry = {
      id: uid(), workerId, anketaId, amount, type, myShare, note,
      createdAt: new Date().toISOString(),
    }
    set(s => {
      const xpGain = Math.floor(myShare / 100)
      const newXp = s.profile.xp + xpGain
      const newLevel = Math.floor(newXp / 1000) + 1
      // Auto-distribute earned USD equally across incomplete goals
      const usdEarned = myShare / s.profile.settings.rubToUsd
      const incompleteGoals = s.profile.goals.filter(g => g.savedAmount < g.targetAmount)
      const perGoal = incompleteGoals.length > 0 ? usdEarned / incompleteGoals.length : 0
      const newGoals = s.profile.goals.map(g =>
        g.savedAmount < g.targetAmount
          ? { ...g, savedAmount: Math.min(g.targetAmount, g.savedAmount + perGoal) }
          : g
      )
      const newProfile = { ...s.profile, totalEarned: s.profile.totalEarned + myShare, xp: newXp, level: newLevel, goals: newGoals }
      saveProfile(newProfile)
      return {
        profits: [entry, ...s.profits],
        workers: s.workers.map(w => w.id === workerId ? { ...w, totalProfit: w.totalProfit + myShare } : w),
        profile: newProfile,
      }
    })
    await supabase.from('profits').insert({
      id: entry.id, worker_id: workerId, anketa_id: anketaId ?? null,
      amount, type, my_share: myShare, note: note ?? null,
      created_at: entry.createdAt,
    })
    await supabase.from('workers').update({ total_profit: get().workers.find(w => w.id === workerId)?.totalProfit ?? 0 }).eq('id', workerId)
  },

  deleteProfit: async (id) => {
    const entry = get().profits.find(p => p.id === id)
    if (!entry) return
    set(s => {
      const newProfile = { ...s.profile, totalEarned: Math.max(0, s.profile.totalEarned - entry.myShare) }
      saveProfile(newProfile)
      return {
        profits: s.profits.filter(p => p.id !== id),
        workers: s.workers.map(w => w.id === entry.workerId ? { ...w, totalProfit: Math.max(0, w.totalProfit - entry.myShare) } : w),
        profile: newProfile,
      }
    })
    await supabase.from('profits').delete().eq('id', id)
    await supabase.from('workers').update({ total_profit: get().workers.find(w => w.id === entry.workerId)?.totalProfit ?? 0 }).eq('id', entry.workerId)
  },

  // ── Goals ────────────────────────────────────────────────────────────
  addGoal: async (goal) => {
    set(s => {
      const newProfile = { ...s.profile, goals: [...s.profile.goals, { ...goal, id: uid() }] }
      saveProfile(newProfile)
      return { profile: newProfile }
    })
  },

  updateGoal: async (id, updates) => {
    set(s => {
      const newProfile = { ...s.profile, goals: s.profile.goals.map(g => g.id === id ? { ...g, ...updates } : g) }
      saveProfile(newProfile)
      return { profile: newProfile }
    })
  },

  deleteGoal: async (id) => {
    set(s => {
      const newProfile = { ...s.profile, goals: s.profile.goals.filter(g => g.id !== id) }
      saveProfile(newProfile)
      return { profile: newProfile }
    })
  },

  addToGoal: async (id, amount) => {
    set(s => {
      const newProfile = {
        ...s.profile,
        goals: s.profile.goals.map(g => g.id === id ? { ...g, savedAmount: Math.min(g.targetAmount, g.savedAmount + amount) } : g),
      }
      saveProfile(newProfile)
      return { profile: newProfile }
    })
  },

  // ── Settings ─────────────────────────────────────────────────────────
  updateSettings: async (s) => {
    set(st => {
      const newProfile = { ...st.profile, settings: { ...st.profile.settings, ...s } }
      saveProfile(newProfile)
      return { profile: newProfile }
    })
  },
}))
