import { useState } from 'react'
import { Plus, Target, Zap, X, Settings } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'
import { useT } from '@/i18n'

const GOAL_EMOJIS = ['📱', '💻', '🚗', '✈️', '👟', '⌚', '🏠', '🎮', '💎', '🔥']
const GOAL_COLORS = ['#7c5cfc', '#22d3a5', '#fbbf24', '#ff5f7e', '#60a5fa', '#f472b6']

export default function Profile() {
  const t = useT()
  const { profile, addGoal, deleteGoal, updateSettings } = useStore()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const [showAddGoal, setShowAddGoal] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [goalEmoji, setGoalEmoji] = useState('📱')
  const [goalColor, setGoalColor] = useState('#7c5cfc')
  const [goalImageUrl, setGoalImageUrl] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [rubRate, setRubRate] = useState(String(r2u))
  const [uahRate, setUahRate] = useState(String(u2ua))

  const xpForLevel = 1000
  const xpProgress = (profile.xp % xpForLevel) / xpForLevel * 100
  const totalUsd = rubToUsd(profile.totalEarned, r2u)
  const goalsUsd = profile.goals.reduce((sum, g) => sum + g.savedAmount, 0)
  const availableUsd = totalUsd + goalsUsd

  const handleAddGoal = () => {
    const target = parseFloat(goalAmount.replace(',', '.'))
    if (!goalTitle.trim() || !target) return
    addGoal({ title: goalTitle.trim(), emoji: goalEmoji, targetAmount: target, savedAmount: 0, color: goalColor, imageUrl: goalImageUrl.trim() || undefined, description: goalDesc.trim() || undefined })
    setGoalTitle(''); setGoalAmount(''); setGoalImageUrl(''); setGoalDesc(''); setShowAddGoal(false)
  }

  const handleSaveSettings = () => {
    const r = parseFloat(rubRate)
    const u = parseFloat(uahRate)
    if (r > 0 && u > 0) updateSettings({ rubToUsd: r, usdToUah: u })
    setShowSettings(false)
  }

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8">
      {/* Profile card */}
      <div className="card-gradient rounded-3xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 left-0 w-32 h-32 rounded-full bg-black/10" />
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-2xl">👑</span>
          </div>
          <div className="flex-1 relative">
            <h2 className="text-xl font-bold text-white">{profile.name}</h2>
            <div className="flex items-center gap-1.5 text-white/70 text-sm">
              <Zap size={12} />
              <span>{t('level_label')} {profile.level}</span>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="text-white/60 hover:text-white relative">
            <Settings size={18} />
          </button>
        </div>

        <div className="mb-1.5 flex justify-between text-xs text-white/60 relative">
          <span>{profile.xp % xpForLevel} XP</span>
          <span>{xpForLevel} XP</span>
        </div>
        <div className="h-1.5 bg-black/20 rounded-full overflow-hidden mb-4 relative">
          <div className="h-full bg-white/80 rounded-full transition-all duration-700" style={{ width: `${xpProgress}%` }} />
        </div>

        <div className="pt-4 border-t border-white/15 relative">
          <p className="text-white/60 text-xs">{t('total_earned')}</p>
          <p className="text-3xl font-bold text-white">{fmtUsd(availableUsd)}</p>
          <p className="text-white/60 text-sm">{fmtUah(usdToUah(availableUsd, u2ua))}</p>
          {goalsUsd > 0 && (
            <p className="text-white/50 text-xs mt-1">
              {t('available_label')}: <span className="text-white/80 font-semibold">{fmtUsd(totalUsd)}</span>
              <span className="ml-1.5">· {t('in_goals_label')}: {fmtUsd(goalsUsd)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Goals */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-base font-bold text-text flex items-center gap-2">
          <Target size={16} className="text-accent-light" />
          {t('goals_header')}
        </h3>
        <button onClick={() => setShowAddGoal(true)} className="flex items-center gap-1.5 text-accent-light text-sm font-medium">
          <Plus size={14} />
          {t('goals_add')}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {profile.goals.map((goal, idx) => {
          const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
          const remaining = goal.targetAmount - goal.savedAmount
          const isLast = idx === profile.goals.length - 1
          return (
            <div key={goal.id} className="glass-light rounded-2xl overflow-hidden">
              {goal.imageUrl && (
                <div className={`relative overflow-hidden ${isLast ? 'h-72' : 'h-36'}`}>
                  <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="font-bold text-white text-lg">{goal.title}</p>
                      {goal.description && <p className="text-white/70 text-xs">{goal.description}</p>}
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-white/60 hover:text-danger">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              <div className="p-4">
                {!goal.imageUrl && (
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{goal.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text">{goal.title}</span>
                        <button onClick={() => deleteGoal(goal.id)} className="text-text-muted hover:text-danger">
                          <X size={14} />
                        </button>
                      </div>
                      {goal.description && <p className="text-text-muted text-xs mt-0.5">{goal.description}</p>}
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-sm font-bold" style={{ color: goal.color }}>{fmtUsd(goal.savedAmount)}</span>
                        <span className="text-xs text-text-muted">of {fmtUsd(goal.targetAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {goal.imageUrl && (
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-sm font-bold" style={{ color: goal.color }}>{fmtUsd(goal.savedAmount)}</span>
                    <span className="text-xs text-text-muted">of {fmtUsd(goal.targetAmount)}</span>
                  </div>
                )}

                <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                </div>

                <div className="flex items-center">
                  <span className="text-xs text-text-muted">{pct.toFixed(0)}%</span>
                  {remaining > 0
                    ? <span className="text-xs text-text-muted ml-2">remaining {fmtUsd(remaining)}</span>
                    : <span className="text-xs text-success ml-2">{t('goal_completed')}</span>
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add goal modal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowAddGoal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg glass rounded-t-3xl p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-white mb-5">{t('new_goal')}</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2 flex-wrap">
                {GOAL_EMOJIS.map(e => (
                  <button key={e} onClick={() => setGoalEmoji(e)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${goalEmoji === e ? 'bg-accent-glow border border-accent/40 scale-110' : 'bg-card border border-border'}`}>{e}</button>
                ))}
              </div>
              <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder={t('goal_name_placeholder')} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent" />
              <input type="text" value={goalDesc} onChange={e => setGoalDesc(e.target.value)} placeholder={t('goal_desc_placeholder')} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent text-sm" />
              <input type="url" value={goalImageUrl} onChange={e => setGoalImageUrl(e.target.value)} placeholder={t('goal_image_placeholder')} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent text-sm" />
              <div className="relative">
                <input type="number" inputMode="decimal" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder={t('goal_amount_placeholder')} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent pr-8" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              </div>
              <div className="flex gap-2">
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setGoalColor(c)} className={`w-8 h-8 rounded-full transition-all ${goalColor === c ? 'scale-125 ring-2 ring-white/30' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={handleAddGoal} disabled={!goalTitle.trim() || !goalAmount} className="w-full btn-gradient rounded-2xl py-3.5 text-white font-semibold disabled:opacity-40 shadow-glow">{t('goal_add_btn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg glass rounded-t-3xl p-6 pb-10 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
            <h3 className="text-lg font-bold text-white mb-5">{t('settings_title')}</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-text-muted mb-2 block">{t('settings_rub_usd')}</label>
                <input type="number" value={rubRate} onChange={e => setRubRate(e.target.value)} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">{t('settings_usd_uah')}</label>
                <input type="number" value={uahRate} onChange={e => setUahRate(e.target.value)} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="text-xs text-text-muted mb-2 block">{t('settings_language')}</label>
                <div className="flex gap-2">
                  {(['en', 'uk'] as const).map(lang => (
                    <button key={lang} onClick={() => updateSettings({ language: lang })}
                      className={`flex-1 py-3 rounded-2xl text-sm font-semibold border transition-all ${profile.settings.language === lang ? 'bg-accent border-accent/40 text-white' : 'bg-card border-border text-text-muted'}`}>
                      {lang === 'en' ? '🇬🇧 English' : '🇺🇦 Українська'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveSettings} className="w-full btn-gradient rounded-2xl py-3.5 text-white font-semibold shadow-glow">{t('settings_save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
