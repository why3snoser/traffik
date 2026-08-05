import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Target, Zap, X, Settings, Trash2, Copy, Key, Mail, Link2, Import } from 'lucide-react'
import { useStore } from '@/store'
import { rubToUsd, usdToUah, fmtUsd, fmtUah, getLevelInfo } from '@/types'
import { useT } from '@/i18n'

const CONFETTI_COLORS = ['#0A84FF', '#64B5FF', '#ffd60a', '#ff453a', '#ffffff', '#5AC8FA']

function Confetti({ active }: { active: boolean }) {
  const particles = useRef(
    Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 1.2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 6,
      isCircle: Math.random() > 0.5,
    }))
  ).current

  if (!active) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className={p.isCircle ? 'absolute rounded-full' : 'absolute rounded-sm'}
          style={{
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}

const GOAL_EMOJIS = ['📱', '💻', '🚗', '✈️', '👟', '⌚', '🏠', '🎮', '💎', '🔥']
const GOAL_COLORS = ['#7c5cfc', '#22d3a5', '#fbbf24', '#ff5f7e', '#60a5fa', '#f472b6']

export default function Profile() {
  const t = useT()
  const { profile, profits, anketas, addGoal, deleteGoal, updateSettings, addAppleId, importAppleIds, removeAppleId } = useStore()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const [showAddGoal, setShowAddGoal] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalAmount, setGoalAmount] = useState('')
  const [goalEmoji, setGoalEmoji] = useState('📱')
  const [goalColor, setGoalColor] = useState('#7c5cfc')
  const [goalImageUrl, setGoalImageUrl] = useState('')
  const [goalImagePos, setGoalImagePos] = useState('center top')
  const [goalDesc, setGoalDesc] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [rubRate, setRubRate] = useState(String(r2u))
  const [uahRate, setUahRate] = useState(String(u2ua))
  const [showConfetti, setShowConfetti] = useState(false)
  const celebratedRef = useRef<Set<string>>(new Set())
  const [newAppleEmail, setNewAppleEmail] = useState('')
  const [newApplePassword, setNewApplePassword] = useState('')
  const [appleImportText, setAppleImportText] = useState('')
  const [appleImportMsg, setAppleImportMsg] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  // Emails currently bound to some city — these accounts are "busy"
  const occupiedEmails = useMemo(() => {
    const set = new Set<string>()
    anketas.forEach(a => a.cities.forEach(c => { if (c.appleId?.email) set.add(c.appleId.email) }))
    return set
  }, [anketas])

  const totalRub = profits.reduce((s, p) => s + p.myShare, 0)
  const totalUsd = rubToUsd(totalRub, r2u)
  const totalUah = usdToUah(totalUsd, u2ua)
  const levelInfo = getLevelInfo(totalUah)

  useEffect(() => {
    profile.goals.forEach(goal => {
      const pct = (totalUsd / goal.targetAmount) * 100
      if (pct >= 100 && !celebratedRef.current.has(goal.id)) {
        celebratedRef.current.add(goal.id)
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }
    })
  }, [profile.goals, totalUsd])

  const handleAddGoal = () => {
    const target = parseFloat(goalAmount.replace(',', '.'))
    if (!goalTitle.trim() || !target) return
    addGoal({ title: goalTitle.trim(), emoji: goalEmoji, targetAmount: target, savedAmount: 0, color: goalColor, imageUrl: goalImageUrl.trim() || undefined, imagePosition: goalImageUrl.trim() ? goalImagePos : undefined, description: goalDesc.trim() || undefined })
    setGoalTitle(''); setGoalAmount(''); setGoalImageUrl(''); setGoalImagePos('center 40%'); setGoalDesc(''); setShowAddGoal(false)
  }

  const handleSaveSettings = () => {
    const r = parseFloat(rubRate)
    const u = parseFloat(uahRate)
    if (r > 0 && u > 0) updateSettings({ rubToUsd: r, usdToUah: u })
    setShowSettings(false)
  }

  const handleAddAppleId = async () => {
    if (!newAppleEmail.trim() || !newApplePassword.trim()) return
    await addAppleId({ email: newAppleEmail.trim(), password: newApplePassword.trim() })
    setNewAppleEmail('')
    setNewApplePassword('')
  }

  const handleImportAppleIds = async () => {
    if (!appleImportText.trim()) return
    const msg = await importAppleIds(appleImportText)
    setAppleImportMsg(msg)
    if (msg.startsWith('Импорт')) setAppleImportText('')
    setTimeout(() => setAppleImportMsg(''), 2500)
  }

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:px-8">
      <Confetti active={showConfetti} />
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
              <span>{t('level_label')} {levelInfo.level}</span>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="text-white/60 hover:text-white relative">
            <Settings size={18} />
          </button>
        </div>

        <div className="mb-1.5 flex justify-between text-xs text-white/60 relative">
          <span>{levelInfo.currentXp.toLocaleString()} ₴</span>
          <span>{levelInfo.neededXp.toLocaleString()} ₴ to lvl {levelInfo.level + 1}</span>
        </div>
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mb-4 relative">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress * 100}%`, background: '#0A84FF', boxShadow: '0 0 8px rgba(10,132,255,0.6)' }} />
        </div>

      </div>

      {/* Balance Card */}
      <div className="rounded-3xl p-6 mb-6 relative overflow-hidden glass" style={{
        borderTopColor: 'rgba(210,230,255,0.5)',
        minHeight: 178,
      }}>
        {/* Decorative rings */}
        <div className="absolute -right-14 -top-14 w-60 h-60 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,132,255,0.16) 0%, transparent 65%)' }} />
        <div className="absolute right-6 -bottom-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,190,255,0.10) 0%, transparent 70%)' }} />
        <div className="absolute -right-6 top-2 w-44 h-44 rounded-full pointer-events-none" style={{ border: '1px solid rgba(160,200,255,0.10)' }} />
        <div className="absolute right-4 -top-4 w-56 h-56 rounded-full pointer-events-none" style={{ border: '1px solid rgba(160,200,255,0.06)' }} />

        <div className="relative flex flex-col h-full">
          {/* Top: chip + logo */}
          <div className="flex items-center justify-between mb-5">
            <div className="w-10 h-7 rounded-md flex overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.45), rgba(0,122,255,0.3))', border: '1px solid rgba(10,132,255,0.35)' }}>
              <div className="w-1/2 h-full" style={{ borderRight: '1px solid rgba(0,0,0,0.2)' }} />
            </div>
            <div className="flex items-center gap-2">
              <div className="neon-dot neon-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(160,200,255,0.8)' }}>TRAFFIK</span>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(160,200,255,0.6)' }}>Загальний баланс</p>
            <p className="text-4xl font-bold text-white tracking-tight num-pop">{fmtUsd(totalUsd)}</p>
            <p className="text-sm mt-1" style={{ color: 'rgba(200,220,255,0.5)' }}>{fmtUah(totalUah)}</p>
          </div>

          {/* Bottom: name + level */}
          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(160,200,255,0.5)' }}>HOLDER</p>
              <p className="text-sm font-bold text-white uppercase tracking-wide">{profile.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(160,200,255,0.5)' }}>LEVEL</p>
              <p className="text-sm font-bold" style={{ color: '#0A84FF' }}>LVL {levelInfo.level}</p>
            </div>
          </div>
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
          const pct = Math.min(100, (totalUsd / goal.targetAmount) * 100)
          const remaining = goal.targetAmount - totalUsd
          const isLast = idx === profile.goals.length - 1
          return (
            <div key={goal.id} className="glass-light rounded-2xl overflow-hidden transition-all duration-500"
              style={pct >= 100 ? { borderColor: 'rgba(10,132,255,0.5)', boxShadow: '0 0 24px rgba(10,132,255,0.15)' } : {}}>

              {goal.imageUrl && (
                <div className={`relative overflow-hidden ${isLast ? 'h-80 md:h-96' : 'h-44 md:h-56'}`}>
                  <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" style={{ objectPosition: goal.imagePosition ?? 'center top', filter: 'brightness(0.75) saturate(0.55)' }} />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(4,10,22,0.9) 0%, rgba(10,132,255,0.06) 60%, transparent 100%)' }} />
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
                        <span className="text-sm font-bold" style={{ color: '#0A84FF' }}>{fmtUsd(totalUsd)}</span>
                        <span className="text-xs text-text-muted">of {fmtUsd(goal.targetAmount)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {goal.imageUrl && (
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-sm font-bold" style={{ color: '#0A84FF' }}>{fmtUsd(totalUsd)}</span>
                    <span className="text-xs text-text-muted">of {fmtUsd(goal.targetAmount)}</span>
                  </div>
                )}

                <div className="h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: '#0A84FF', boxShadow: '0 0 8px rgba(10,132,255,0.5)' }} />
                </div>

                <div className="flex items-center">
                  <span className="text-xs text-text-muted">{Math.min(100, pct).toFixed(0)}%</span>
                  {remaining > 0
                    ? <span className="text-xs text-text-muted ml-2">залишилось {fmtUsd(remaining)}</span>
                    : <span className="text-xs font-bold ml-2" style={{ color: '#0A84FF' }}>🎉 Ціль досягнута!</span>
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-lg sheet rounded-t-3xl p-6 pb-10 animate-pop" onClick={e => e.stopPropagation()}>
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
              {goalImageUrl.trim() && (
                <div>
                  <p className="text-xs text-text-muted mb-2">Фокус фото</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      'left top',    'center top',    'right top',
                      'left center', 'center center', 'right center',
                      'left bottom', 'center bottom', 'right bottom',
                    ].map(val => {
                      const icons: Record<string, string> = {
                        'left top': '↖', 'center top': '↑', 'right top': '↗',
                        'left center': '←', 'center center': '·', 'right center': '→',
                        'left bottom': '↙', 'center bottom': '↓', 'right bottom': '↘',
                      }
                      return (
                        <button key={val} onClick={() => setGoalImagePos(val)}
                          className={`py-2 rounded-xl text-base font-bold transition-all ${goalImagePos === val ? 'btn-gradient' : 'glass-light text-text-muted hover:text-text'}`}>
                          {icons[val]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="relative">
                <input type="number" inputMode="decimal" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder={t('goal_amount_placeholder')} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent pr-8" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
              </div>
              <div className="flex gap-2">
                {GOAL_COLORS.map(c => (
                  <button key={c} onClick={() => setGoalColor(c)} className={`w-8 h-8 rounded-full transition-all ${goalColor === c ? 'scale-125 ring-2 ring-white/30' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={handleAddGoal} disabled={!goalTitle.trim() || !goalAmount} className="w-full btn-gradient rounded-2xl py-3.5 font-semibold disabled:opacity-40 shadow-glow">{t('goal_add_btn')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
          <div className="relative w-full max-w-lg sheet rounded-t-3xl p-6 pb-10 animate-pop" onClick={e => e.stopPropagation()}>
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

              {/* Apple ID Management */}
              <div>
                <label className="text-xs text-text-muted mb-2 block">Apple ID для премиума</label>
                <div className="bg-card border border-border rounded-2xl p-3 mb-3 max-h-56 overflow-y-auto">
                  {(profile.appleIds ?? []).length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-2">Нет сохраненных Apple ID</p>
                  ) : (
                    <div className="space-y-2">
                      {(profile.appleIds ?? []).map(appleId => {
                        const occupied = occupiedEmails.has(appleId.email)
                        return (
                          <div key={appleId.email} className={`rounded-xl p-2 ${occupied ? 'bg-black/20 opacity-60' : 'bg-bg'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${occupied ? 'bg-white/10 text-text-muted' : 'bg-accent/15 text-accent-light'}`}>
                                    {occupied ? 'Занята' : 'Свободна'}
                                  </span>
                                  <span className="text-[10px] text-text-muted">{occupied ? 'привязана к городу' : 'доступна'}</span>
                                </div>
                                <p className="text-xs font-mono text-text mt-1 truncate" title={appleId.email}>{appleId.email}</p>
                              </div>
                              <button
                                onClick={() => removeAppleId(appleId.email)}
                                className="flex-shrink-0 text-text-muted hover:text-danger transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Copy / open actions */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <button
                                onClick={() => copy(appleId.email, `a-${appleId.email}`)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-[10px] font-medium text-text-muted hover:text-text"
                              >
                                <Copy size={11} /> Email
                                {copied === `a-${appleId.email}` && <span className="text-success">✓</span>}
                              </button>
                              <button
                                onClick={() => copy(appleId.password, `ap-${appleId.email}`)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-[10px] font-medium text-text-muted hover:text-text"
                              >
                                <Key size={11} /> Пароль
                                {copied === `ap-${appleId.email}` && <span className="text-success">✓</span>}
                              </button>
                              {appleId.mailPassword && (
                                <button
                                  onClick={() => copy(appleId.mailPassword!, `amp-${appleId.email}`)}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border text-[10px] font-medium text-text-muted hover:text-text"
                                >
                                  <Mail size={11} /> Почта
                                  {copied === `amp-${appleId.email}` && <span className="text-success">✓</span>}
                                </button>
                              )}
                              {appleId.smsLink && (
                                <a
                                  href={appleId.smsLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 border border-accent/20 text-[10px] font-medium text-accent-light"
                                >
                                  <Link2 size={11} /> Код
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Import list of accounts */}
                <div className="space-y-2 mb-3">
                  <textarea
                    value={appleImportText}
                    onChange={e => setAppleImportText(e.target.value)}
                    placeholder={'Вставь список:\nПочта: ...\nПароль: ...\nПароль от почты: ...\nузнать код: https://...'}
                    rows={3}
                    className="w-full bg-card border border-border rounded-2xl px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none font-mono"
                  />
                  {appleImportMsg && <p className="text-[11px] text-success px-1">{appleImportMsg}</p>}
                  <button
                    onClick={handleImportAppleIds}
                    disabled={!appleImportText.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl text-xs font-semibold bg-accent/20 border border-accent/40 text-accent-light disabled:opacity-40 transition-all"
                  >
                    <Import size={12} />
                    Импортировать список
                  </button>
                </div>

                {/* Add new Apple ID manually */}
                <div className="space-y-2">
                  <input
                    type="email"
                    value={newAppleEmail}
                    onChange={e => setNewAppleEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-card border border-border rounded-2xl px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                  />
                  <input
                    type="password"
                    value={newApplePassword}
                    onChange={e => setNewApplePassword(e.target.value)}
                    placeholder="Пароль"
                    className="w-full bg-card border border-border rounded-2xl px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={handleAddAppleId}
                    disabled={!newAppleEmail.trim() || !newApplePassword.trim()}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-2xl text-xs font-semibold bg-accent/20 border border-accent/40 text-accent-light disabled:opacity-40 transition-all"
                  >
                    <Plus size={12} />
                    Добавить Apple ID
                  </button>
                </div>
              </div>
              <button onClick={handleSaveSettings} className="w-full btn-gradient rounded-2xl py-3.5 font-semibold shadow-glow">{t('settings_save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
