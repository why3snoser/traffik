import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Worker, Anketa, ProfitEntry, UserProfile, Goal,
  CityEntry, VKAccount, calcMyShare, ProfitType, parseVkList
} from '@/types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Crowley',
  level: 1,
  xp: 0,
  totalEarned: 0,
  goals: [
    { id: uid(), title: 'iPhone 16 Pro', emoji: '📱', targetAmount: 1300, savedAmount: 0, color: '#7c5cfc' },
    { id: uid(), title: 'MacBook Pro', emoji: '💻', targetAmount: 2800, savedAmount: 0, color: '#22d3a5' },
  ],
  settings: {
    rubToUsd: 90,
    usdToUah: 43.70,
  },
}

interface AppState {
  workers: Worker[]
  anketas: Anketa[]
  profits: ProfitEntry[]
  profile: UserProfile

  // Workers
  addWorker: (name: string, emoji: string) => Worker
  updateWorker: (id: string, updates: Partial<Pick<Worker, 'name' | 'emoji'>>) => void
  deleteWorker: (id: string) => void

  // Anketas
  addAnketa: (data: Omit<Anketa, 'id' | 'createdAt' | 'updatedAt' | 'photos' | 'videos'>) => void
  updateAnketa: (id: string, updates: Partial<Anketa>) => void
  deleteAnketa: (id: string) => void

  // VK auto-assign: paste list, assign to cities without VK in given anketa
  assignVkToAnketa: (anketaId: string, rawList: string) => string // returns message
  removeVkFromCity: (anketaId: string, cityId: string) => void

  // Profits
  addProfit: (workerId: string, amount: number, type: ProfitType, note?: string, anketaId?: string) => void
  deleteProfit: (id: string) => void

  // Goals
  addGoal: (goal: Omit<Goal, 'id'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  addToGoal: (id: string, amount: number) => void

  // Settings
  updateSettings: (s: Partial<UserProfile['settings']>) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      workers: [],
      anketas: [],
      profits: [],
      profile: DEFAULT_PROFILE,

      // --- Workers ---
      addWorker: (name, emoji) => {
        const worker: Worker = {
          id: uid(), name, emoji, totalProfit: 0, createdAt: new Date().toISOString(),
        }
        set(s => ({ workers: [worker, ...s.workers] }))
        return worker
      },

      updateWorker: (id, updates) =>
        set(s => ({ workers: s.workers.map(w => w.id === id ? { ...w, ...updates } : w) })),

      deleteWorker: (id) =>
        set(s => ({
          workers: s.workers.filter(w => w.id !== id),
          anketas: s.anketas.filter(a => a.workerId !== id),
          profits: s.profits.filter(p => p.workerId !== id),
        })),

      // --- Anketas ---
      addAnketa: (data) =>
        set(s => ({
          anketas: [{
            ...data,
            id: uid(),
            photos: [],
            videos: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, ...s.anketas],
        })),

      updateAnketa: (id, updates) =>
        set(s => ({
          anketas: s.anketas.map(a =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        })),

      deleteAnketa: (id) =>
        set(s => ({ anketas: s.anketas.filter(a => a.id !== id) })),

      // --- VK auto-assign ---
      assignVkToAnketa: (anketaId, rawList) => {
        const accounts: VKAccount[] = parseVkList(rawList)
        if (accounts.length === 0) return 'Не удалось распознать аккаунты'

        const anketa = get().anketas.find(a => a.id === anketaId)
        if (!anketa) return 'Анкета не найдена'

        const freeCities = anketa.cities.filter(c => !c.vk)
        if (freeCities.length === 0) return 'Все города уже имеют ВК аккаунты'

        // Shuffle accounts
        const shuffled = [...accounts].sort(() => Math.random() - 0.5)
        const toAssign = shuffled.slice(0, freeCities.length)

        const updatedCities: CityEntry[] = anketa.cities.map(city => {
          if (city.vk) return city
          const acc = toAssign.shift()
          return acc ? { ...city, vk: acc } : city
        })

        set(s => ({
          anketas: s.anketas.map(a =>
            a.id === anketaId
              ? { ...a, cities: updatedCities, updatedAt: new Date().toISOString() }
              : a
          ),
        }))

        const assigned = updatedCities.filter(c => c.vk).length - (anketa.cities.filter(c => c.vk).length)
        return `Привязано ${assigned} аккаунтов`
      },

      removeVkFromCity: (anketaId, cityId) =>
        set(s => ({
          anketas: s.anketas.map(a =>
            a.id === anketaId
              ? {
                  ...a,
                  cities: a.cities.map(c => c.id === cityId ? { ...c, vk: undefined } : c),
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        })),

      // --- Profits ---
      addProfit: (workerId, amount, type, note, anketaId) => {
        const myShare = calcMyShare(amount, type)
        const entry: ProfitEntry = {
          id: uid(), workerId, anketaId, amount, type, myShare, note,
          createdAt: new Date().toISOString(),
        }
        set(s => {
          const xpGain = Math.floor(myShare / 100)
          const newXp = s.profile.xp + xpGain
          const newLevel = Math.floor(newXp / 1000) + 1
          return {
            profits: [entry, ...s.profits],
            workers: s.workers.map(w =>
              w.id === workerId ? { ...w, totalProfit: w.totalProfit + myShare } : w
            ),
            profile: {
              ...s.profile,
              totalEarned: s.profile.totalEarned + myShare,
              xp: newXp,
              level: newLevel,
            },
          }
        })
      },

      deleteProfit: (id) =>
        set(s => {
          const entry = s.profits.find(p => p.id === id)
          if (!entry) return s
          return {
            profits: s.profits.filter(p => p.id !== id),
            workers: s.workers.map(w =>
              w.id === entry.workerId ? { ...w, totalProfit: Math.max(0, w.totalProfit - entry.myShare) } : w
            ),
            profile: {
              ...s.profile,
              totalEarned: Math.max(0, s.profile.totalEarned - entry.myShare),
            },
          }
        }),

      // --- Goals ---
      addGoal: (goal) =>
        set(s => ({
          profile: { ...s.profile, goals: [...s.profile.goals, { ...goal, id: uid() }] },
        })),

      updateGoal: (id, updates) =>
        set(s => ({
          profile: {
            ...s.profile,
            goals: s.profile.goals.map(g => g.id === id ? { ...g, ...updates } : g),
          },
        })),

      deleteGoal: (id) =>
        set(s => ({
          profile: { ...s.profile, goals: s.profile.goals.filter(g => g.id !== id) },
        })),

      addToGoal: (id, amount) =>
        set(s => ({
          profile: {
            ...s.profile,
            goals: s.profile.goals.map(g =>
              g.id === id ? { ...g, savedAmount: Math.min(g.targetAmount, g.savedAmount + amount) } : g
            ),
          },
        })),

      // --- Settings ---
      updateSettings: (s) =>
        set(st => ({
          profile: { ...st.profile, settings: { ...st.profile.settings, ...s } },
        })),
    }),
    { name: 'traffik-v2' }
  )
)
