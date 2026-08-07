import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import {
  Worker, Anketa, ProfitEntry, UserProfile, Goal,
  CityEntry, VKAccount, AppleIdEntry, SessionRecord, SessionTimer,
  calcMyShare, ProfitType, parseVkList, parseAppleIds,
  getLevelInfo, rubToUsd, usdToUah,
} from '@/types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Per-worker session timer persistence (local, survives reload) ──────
const LS_WS = 'traffik_focus_v1'

interface PersistedWS {
  sessions: SessionRecord[]
  workerTime: Record<string, number>
  workerBaseline: Record<string, number>
  workerTimers: Record<string, SessionTimer>
}

const EMPTY_WS: PersistedWS = { sessions: [], workerTime: {}, workerBaseline: {}, workerTimers: {} }

function loadWS(): PersistedWS {
  try {
    const d = JSON.parse(localStorage.getItem(LS_WS) ?? 'null')
    if (d && typeof d === 'object') {
      return {
        sessions: Array.isArray(d.sessions) ? d.sessions : [],
        workerTime: d.workerTime ?? {},
        workerBaseline: d.workerBaseline ?? {},
        workerTimers: d.workerTimers ?? {},
      }
    }
  } catch { /* ignore */ }
  return EMPTY_WS
}
function saveWS(d: PersistedWS) {
  try { localStorage.setItem(LS_WS, JSON.stringify(d)) } catch { /* ignore */ }
}

const DEFAULT_SETTINGS = { rubToUsd: 90, usdToUah: 43.70, language: 'en' as const }

const DEFAULT_GOALS: Goal[] = [
  {
    id: 'goal-iphone',
    title: 'iPhone 17 Pro Max',
    emoji: '📱',
    targetAmount: 1300,
    savedAmount: 0,
    color: '#7c5cfc',
    imageUrl: '/goals/iphone-17-cutout.png?v=2',
    imageScale: 1.42,
    description: 'iPhone 17 Pro Max · 256GB',
  },
  {
    id: 'goal-macbook',
    title: 'MacBook Pro 16',
    emoji: '💻',
    targetAmount: 3200,
    savedAmount: 0,
    color: '#60a5fa',
    imageUrl: '/goals/macbook-pro-16.png?v=2',
    imageScale: 1.15,
    description: 'MacBook Pro 16 · M4 Max · 48GB · 1TB',
  },
  {
    id: 'goal-earbuds',
    title: 'AirPods Pro',
    emoji: '🎧',
    targetAmount: 300,
    savedAmount: 0,
    color: '#22d3a5',
    imageUrl: 'https://ik.imagekit.io/kqmrslzuq/SOUND/right-earbud.png',
    description: 'AirPods Pro · Spatial Audio · Active Noise Cancellation',
    variants: [
      {
        id: 'left',
        label: 'Left',
        title: 'Spatial Anchor',
        description: 'The primary node for binaural synchronization. Handles low-latency transmission and anchors the spatial audio soundstage.',
        image: 'https://ik.imagekit.io/kqmrslzuq/SOUND/left-earbud.png',
        color: '#3b82f6',
      },
      {
        id: 'right',
        label: 'Right',
        title: 'Vocal Clarity',
        description: 'Optimized for high-frequency detail and voice pickup. Contains the beamforming microphone array for crystal clear calls.',
        image: 'https://ik.imagekit.io/kqmrslzuq/SOUND/right-earbud.png',
        color: '#10b981',
      },
    ],
  },
  {
    id: 'goal-angelina',
    title: 'Ангелина 💕',
    emoji: '💕',
    targetAmount: 10000,
    savedAmount: 0,
    color: '#f472b6',
    imageUrl: 'https://i.postimg.cc/CLGnK9W0/photo-2026-04-06-03-06-26.jpg',
    imageFit: 'cover',
    imagePosition: 'center',
    description: 'Цель мечты',
    variants: [
      {
        id: 'left',
        label: 'Фото 1',
        title: 'Ангелина 💕',
        description: 'Цель мечты',
        image: 'https://i.postimg.cc/CLGnK9W0/photo-2026-04-06-03-06-26.jpg',
        color: '#f472b6',
      },
      {
        id: 'right',
        label: 'Фото 2',
        title: 'Ангелина 💕',
        description: 'Цель мечты',
        image: 'https://i.ibb.co/1G0Kr3Gq/photo-2026-04-23-03-03-04.jpg',
        color: '#ec4899',
      },
    ],
  },
]

const DEFAULT_APPLE_IDS: AppleIdEntry[] = [
  { email: 'vimijadumobi39@gmail.com', password: '3Bq4vmd2' },
  { email: 'axewawizu139@gmail.com', password: '3Bq4vmd2' },
  { email: 'tometucahan033@gmail.com', password: '3Bq4vmd2' },
  {
    email: 'erironivu13@gmail.com',
    password: '3Bq4vmd2',
    smsLink: 'https://sms-555.com/5/cacgahbebidjfjn2k4qjhjts3fmrb0at',
  },
  { email: 'whysnoser@gmail.com', password: 'Weryte321' },
  {
    email: 'babinskiyvlad2010@gmail.com',
    password: '3Bq4vmd2',
    smsLink: 'https://sms-555.com/5/cacgahbebjdaceuyl92a6bvbi1ukt49s',
  },
]

const DEFAULT_PROFILE: UserProfile = {
  name: 'Crowley',
  level: 1,
  xp: 0,
  totalEarned: 0,
  goals: DEFAULT_GOALS,
  settings: DEFAULT_SETTINGS,
  appleIds: DEFAULT_APPLE_IDS,
}

interface AppState {
  workers: Worker[]
  anketas: Anketa[]
  profits: ProfitEntry[]
  profile: UserProfile
  initialized: boolean

  sessions: SessionRecord[]
  workerTime: Record<string, number>       // accumulated tracked ms per worker
  workerBaseline: Record<string, number>   // profit RUB at first tracked session per worker
  workerTimers: Record<string, SessionTimer> // live per-worker stopwatches

  initialize: () => Promise<void>

  startWorkerSession: (workerId: string) => void
  stopWorkerSession: (workerId: string) => void
  discardWorkerSession: (workerId: string) => void
  clearSessions: () => void

  addWorker: (name: string, emoji: string) => Promise<Worker>
  updateWorker: (id: string, updates: Partial<Pick<Worker, 'name' | 'emoji'>>) => Promise<void>
  deleteWorker: (id: string) => Promise<void>

  addAnketa: (data: Omit<Anketa, 'id' | 'createdAt' | 'updatedAt' | 'photos' | 'videos'>) => Promise<void>
  updateAnketa: (id: string, updates: Partial<Anketa>) => Promise<void>
  deleteAnketa: (id: string) => Promise<void>

  loadAnketaMedia: (id: string) => Promise<void>
  addAnketaPhotos: (id: string, photos: string[]) => Promise<void>
  removeAnketaPhoto: (id: string, index: number) => Promise<void>
  setAnketaVideo: (id: string, videoDataUrl: string) => Promise<void>
  removeAnketaVideo: (id: string) => Promise<void>

  assignVkToAnketa: (anketaId: string, rawList: string) => Promise<string>
  setVkForCity: (anketaId: string, cityId: string, login: string, password: string) => Promise<void>
  removeVkFromCity: (anketaId: string, cityId: string) => Promise<void>

  setEmailForCity: (anketaId: string, cityId: string, email: string) => Promise<void>
  removeEmailFromCity: (anketaId: string, cityId: string) => Promise<void>

  addProfit: (workerId: string, amount: number, type: ProfitType, note?: string, anketaId?: string) => Promise<void>
  deleteProfit: (id: string) => Promise<void>

  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  addToGoal: (id: string, amount: number) => Promise<void>

  openedGoalId: string | null
  setOpenedGoalId: (id: string | null) => void

  setWorkerAvatar: (workerId: string, url: string) => Promise<void>

  setAppleIdForCity: (anketaId: string, cityId: string, appleId: AppleIdEntry) => Promise<void>
  removeAppleIdFromCity: (anketaId: string, cityId: string) => Promise<void>

  addAppleId: (appleId: AppleIdEntry) => Promise<void>
  importAppleIds: (raw: string) => Promise<string>
  removeAppleId: (email: string) => Promise<void>

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
    // The profile table has no dedicated columns for these, so stash them in
    // the settings jsonb object to keep Apple IDs and worker avatars persisted.
    settings: {
      ...profile.settings,
      _workerAvatars: profile.workerAvatars ?? {},
      _appleIds: profile.appleIds ?? [],
    },
  })
}

export const useStore = create<AppState>()((set, get) => ({
  workers: [],
  anketas: [],
  profits: [],
  profile: DEFAULT_PROFILE,
  initialized: false,
  sessions: loadWS().sessions,
  workerTime: loadWS().workerTime,
  workerBaseline: loadWS().workerBaseline,
  workerTimers: loadWS().workerTimers,

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
      supabase.from('anketas').select('id, worker_id, name, age, telegram, cities, birth_dates, notes, created_at, updated_at').order('created_at', { ascending: false }),
      supabase.from('profits').select('*').order('created_at', { ascending: false }),
      supabase.from('profile').select('id, name, level, xp, total_earned, goals, settings').eq('id', 1),
    ])

    const p = profileRows?.[0]
    const rawSettings = (p?.settings ?? DEFAULT_SETTINGS) as UserProfile['settings'] & {
      _workerAvatars?: Record<string, string>
      _appleIds?: AppleIdEntry[]
    }
    const profile: UserProfile = p ? {
      name: p.name,
      level: p.level,
      xp: p.xp,
      totalEarned: p.total_earned,
      goals: p.goals ?? [],
      settings: rawSettings,
      workerAvatars: rawSettings._workerAvatars ?? {},
      appleIds: (rawSettings._appleIds ?? []).length > 0 ? rawSettings._appleIds : DEFAULT_APPLE_IDS,
    } : DEFAULT_PROFILE

    // Recalculate totals from the authoritative profit records so the stored
    // counter can never drift out of sync with the actual entries.
    const totalEarnedFromProfits = (profits ?? []).reduce((sum, pr) => sum + (pr.my_share ?? 0), 0)
    const freshUah = usdToUah(rubToUsd(totalEarnedFromProfits, profile.settings.rubToUsd), profile.settings.usdToUah)
    const { level } = getLevelInfo(freshUah)
    profile.totalEarned = totalEarnedFromProfits
    profile.xp = Math.floor(freshUah)
    profile.level = level

    // If no profile row yet, create it. If goals empty, seed defaults.
    if (!p) {
      await saveProfile(DEFAULT_PROFILE)
    } else {
      if (profile.goals.length === 0) {
        profile.goals = DEFAULT_GOALS
      } else {
        // Goals the user has given their own image are treated as user-customized:
        // never rename, replace or touch them — only heal goals that still use the
        // default placeholder (no imageUrl yet).
        const seen = new Set<string>()
        const placeholderRenames: Record<string, string> = { 'goal-bmw': 'goal-macbook', 'goal-apt': 'goal-earbuds' }
        profile.goals = profile.goals
          .map(g => {
            if (g.imageUrl) return g
            const renamed = placeholderRenames[g.id]
            if (renamed) {
              const def = DEFAULT_GOALS.find(d => d.id === renamed)
              return def ? { ...def, savedAmount: g.savedAmount } : g
            }
            const def = DEFAULT_GOALS.find(d => d.id === g.id)
            if (def) return { ...def, savedAmount: g.savedAmount }
            return g
          })
          .filter(g => {
            if (seen.has(g.id)) return false
            seen.add(g.id)
            return true
          })
      }
      // Persist healed counter (and any goal patches) back to the DB
      await saveProfile(profile)
    }

    set({
      initialized: true,
      workers: (workers ?? []).map(w => ({
        id: w.id, name: w.name, emoji: w.emoji,
        avatarUrl: profile.workerAvatars?.[w.id],
        totalProfit: w.total_profit, createdAt: w.created_at,
      })),
      anketas: (anketas ?? []).map(a => ({
        id: a.id, workerId: a.worker_id, name: a.name,
        age: a.age, telegram: a.telegram,
        cities: a.cities ?? [],
        birthDates: a.birth_dates ?? [],
        notes: a.notes,
        photos: [], videos: [],
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
    if (updates.videos !== undefined) dbUpdates.videos = updates.videos
    await supabase.from('anketas').update(dbUpdates).eq('id', id)
  },

  deleteAnketa: async (id) => {
    set(s => ({ anketas: s.anketas.filter(a => a.id !== id) }))
    await supabase.from('anketas').delete().eq('id', id)
  },

  // ── Anketa media (photos / verification video) ───────────────────────
  loadAnketaMedia: async (id) => {
    const { data } = await supabase.from('anketas').select('photos, videos').eq('id', id).single()
    if (!data) return
    set(s => ({
      anketas: s.anketas.map(a =>
        a.id === id ? { ...a, photos: data.photos ?? [], videos: data.videos ?? [] } : a
      ),
    }))
  },

  addAnketaPhotos: async (id, photos) => {
    const anketa = get().anketas.find(a => a.id === id)
    if (!anketa) return
    const next = [...(anketa.photos ?? []), ...photos]
    await get().updateAnketa(id, { photos: next })
  },

  removeAnketaPhoto: async (id, index) => {
    const anketa = get().anketas.find(a => a.id === id)
    if (!anketa) return
    const next = (anketa.photos ?? []).filter((_, i) => i !== index)
    await get().updateAnketa(id, { photos: next })
  },

  setAnketaVideo: async (id, videoDataUrl) => {
    await get().updateAnketa(id, { videos: [videoDataUrl] })
  },

  removeAnketaVideo: async (id) => {
    await get().updateAnketa(id, { videos: [] })
  },

  // ── VK assign ────────────────────────────────────────────────────────
  assignVkToAnketa: async (anketaId, rawList) => {
    const accounts: VKAccount[] = parseVkList(rawList)
    if (accounts.length === 0) return 'Could not recognize accounts'
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return 'Profile not found'
    const freeCities = anketa.cities.filter(c => !c.vk)
    if (freeCities.length === 0) return 'All locations already have linked accounts'
    const shuffled = [...accounts].sort(() => Math.random() - 0.5)
    const toAssign = shuffled.slice(0, freeCities.length)
    const updatedCities: CityEntry[] = anketa.cities.map(city => {
      if (city.vk) return city
      const acc = toAssign.shift()
      return acc ? { ...city, vk: acc } : city
    })
    await get().updateAnketa(anketaId, { cities: updatedCities })
    const assigned = updatedCities.filter(c => c.vk).length - anketa.cities.filter(c => c.vk).length
    return `Linked ${assigned} account${assigned === 1 ? '' : 's'}`
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

  setEmailForCity: async (anketaId, cityId, email) => {
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return
    const updatedCities = anketa.cities.map(c =>
      c.id === cityId ? { ...c, email } : c
    )
    await get().updateAnketa(anketaId, { cities: updatedCities })
  },

  removeEmailFromCity: async (anketaId, cityId) => {
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return
    const updatedCities = anketa.cities.map(c => c.id === cityId ? { ...c, email: undefined } : c)
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
      const newTotalEarned = s.profile.totalEarned + myShare
      const totalUah = usdToUah(rubToUsd(newTotalEarned, s.profile.settings.rubToUsd), s.profile.settings.usdToUah)
      const { level } = getLevelInfo(totalUah)
      const newProfile = { ...s.profile, totalEarned: newTotalEarned, xp: Math.floor(totalUah), level }
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

  openedGoalId: null,
  setOpenedGoalId: (id) => set({ openedGoalId: id }),

  // ── Worker avatars ───────────────────────────────────────────────────
  setWorkerAvatar: async (workerId, url) => {
    set(s => {
      const avatars = { ...(s.profile.workerAvatars ?? {}), [workerId]: url }
      const newProfile = { ...s.profile, workerAvatars: avatars }
      saveProfile(newProfile)
      return {
        profile: newProfile,
        workers: s.workers.map(w => w.id === workerId ? { ...w, avatarUrl: url } : w),
      }
    })
  },

  // ── Apple ID for premium ───────────────────────────────────────────────
  setAppleIdForCity: async (anketaId, cityId, appleId) => {
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return
    const updatedCities = anketa.cities.map(c =>
      c.id === cityId ? { ...c, appleId } : c
    )
    await get().updateAnketa(anketaId, { cities: updatedCities })
  },

  removeAppleIdFromCity: async (anketaId, cityId) => {
    const anketa = get().anketas.find(a => a.id === anketaId)
    if (!anketa) return
    const updatedCities = anketa.cities.map(c => c.id === cityId ? { ...c, appleId: undefined } : c)
    await get().updateAnketa(anketaId, { cities: updatedCities })
  },

  // ── Apple ID management ────────────────────────────────────────────────
  addAppleId: async (appleId) => {
    set(s => {
      const exists = (s.profile.appleIds ?? []).some(id => id.email === appleId.email)
      if (exists) return {}
      const newProfile = {
        ...s.profile,
        appleIds: [...(s.profile.appleIds ?? []), appleId],
      }
      saveProfile(newProfile)
      return { profile: newProfile }
    })
  },

  importAppleIds: async (raw) => {
    const accounts = parseAppleIds(raw)
    if (accounts.length === 0) return 'Could not recognize accounts. Check the format.'
    set(s => {
      const existing = new Set((s.profile.appleIds ?? []).map(id => id.email))
      const newOnes = accounts.filter(a => !existing.has(a.email))
      const newProfile = {
        ...s.profile,
        appleIds: [...(s.profile.appleIds ?? []), ...newOnes],
      }
      saveProfile(newProfile)
      return { profile: newProfile }
    })
    return `Imported ${accounts.length} account${accounts.length === 1 ? '' : 's'}`
  },

  removeAppleId: async (email) => {
    set(s => {
      const newProfile = {
        ...s.profile,
        appleIds: (s.profile.appleIds ?? []).filter(id => id.email !== email),
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

  // ── Per-worker work session timer ────────────────────────────────────
  startWorkerSession: (workerId) => {
    const s = get()
    const worker = s.workers.find(w => w.id === workerId)
    if (!worker) return
    set(() => {
      const baseline = s.workerBaseline[workerId] ?? worker.totalProfit
      const workerTimers = { ...s.workerTimers, [workerId]: { running: true, startedAt: Date.now() } }
      const workerBaseline = { ...s.workerBaseline, [workerId]: baseline }
      saveWS({ sessions: s.sessions, workerTime: s.workerTime, workerBaseline, workerTimers })
      return { workerTimers, workerBaseline }
    })
  },

  stopWorkerSession: (workerId) => {
    const s = get()
    const t = s.workerTimers[workerId]
    if (!t?.running || !t.startedAt) return
    const durationMs = Math.max(0, Date.now() - t.startedAt)
    const worker = s.workers.find(w => w.id === workerId)
    const profit = worker?.totalProfit ?? 0
    const baseline = s.workerBaseline[workerId] ?? profit
    const session: SessionRecord = {
      id: uid(), workerId, endedAt: new Date().toISOString(),
      durationMs, profitDeltaRub: Math.max(0, profit - baseline),
    }
    const workerTimers = { ...s.workerTimers, [workerId]: { running: false, startedAt: null } }
    const workerTime = { ...s.workerTime, [workerId]: (s.workerTime[workerId] ?? 0) + durationMs }
    const sessions = [session, ...s.sessions].slice(0, 120)
    saveWS({ sessions, workerTime, workerBaseline: s.workerBaseline, workerTimers })
    set({ workerTimers, workerTime, sessions })
  },

  discardWorkerSession: (workerId) => {
    const s = get()
    const workerTimers = { ...s.workerTimers, [workerId]: { running: false, startedAt: null } }
    saveWS({ sessions: s.sessions, workerTime: s.workerTime, workerBaseline: s.workerBaseline, workerTimers })
    set({ workerTimers })
  },

  clearSessions: () => {
    const s = get()
    const data: PersistedWS = {
      sessions: [],
      workerTime: {},
      workerBaseline: {},
      workerTimers: s.workerTimers,
    }
    saveWS(data)
    set({ sessions: [], workerTime: {}, workerBaseline: {} })
  },
}))
