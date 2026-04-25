import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Trash2, Phone, Key, Tag, Calendar, Wifi, WifiOff, ClipboardList, X, Monitor, Gift, Copy, ArrowRight } from 'lucide-react'
import { useStore } from '@/store'
import { useState, useMemo } from 'react'
import { useT } from '@/i18n'

export default function AnketaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const t = useT()
  const { anketas, deleteAnketa, assignVkToAnketa, setVkForCity, removeVkFromCity, profile, setAppleIdForCity, removeAppleIdFromCity } = useStore()
  const [copied, setCopied] = useState<string | null>(null)
  const [showVkImport, setShowVkImport] = useState(false)
  const [vkRaw, setVkRaw] = useState('')
  const [vkMsg, setVkMsg] = useState('')
  const [manualCityId, setManualCityId] = useState<string | null>(null)
  const [manualVkText, setManualVkText] = useState('')
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [selectedCityIdForPremium, setSelectedCityIdForPremium] = useState<string | null>(null)
  const [selectedAppleIdIndex, setSelectedAppleIdIndex] = useState<number | null>(null)

  const anketa = anketas.find(a => a.id === id)
  if (!anketa) return <div className="p-8 text-text-muted">Не найдено</div>

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleDelete = () => {
    if (confirm(t('delete_anketa_confirm')(anketa.name))) {
      deleteAnketa(anketa.id)
      navigate(`/workers/${anketa.workerId}`)
    }
  }

  const handleVkAssign = async () => {
    const msg = await assignVkToAnketa(anketa.id, vkRaw)
    setVkMsg(msg)
    setVkRaw('')
    setTimeout(() => { setVkMsg(''); setShowVkImport(false) }, 2000)
  }

  const handleManualVk = async (cityId: string) => {
    const lines = manualVkText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return
    await setVkForCity(anketa.id, cityId, lines[0], lines[1])
    setManualCityId(null)
    setManualVkText('')
  }

  const handleInstalledPremium = async () => {
    if (!selectedCityIdForPremium || selectedAppleIdIndex === null) return
    const appleId = availableAppleIds[selectedAppleIdIndex]
    if (!appleId) return
    await setAppleIdForCity(anketa.id, selectedCityIdForPremium, appleId.email, appleId.password)
    setShowPremiumModal(false)
    setSelectedCityIdForPremium(null)
    setSelectedAppleIdIndex(null)
  }

  const citiesWithVk = anketa.cities.filter(c => c.vk).length

  const availableAppleIds = useMemo(() => {
    const usedEmails = new Set<string>()
    anketas.forEach(a => {
      a.cities.forEach(city => {
        if (city.appleId?.email) usedEmails.add(city.appleId.email)
      })
    })
    return (profile.appleIds ?? []).filter(id => !usedEmails.has(id.email))
  }, [anketas, profile.appleIds])

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="px-4 pt-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1" />
          <button onClick={() => navigate(`/anketas/${id}/edit`)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted">
            <Edit3 size={16} />
          </button>
          <button onClick={handleDelete} className="w-9 h-9 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
            <Trash2 size={16} />
          </button>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-1">
          <div className="w-16 h-16 rounded-2xl bg-accent-glow border border-accent/20 flex items-center justify-center">
            <span className="text-2xl font-bold gradient-text">{anketa.name.charAt(0)}</span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <button onClick={() => copy(anketa.name, 'name')} className="text-left">
                <h2 className="text-xl font-bold text-text">
                  {anketa.name}
                  {copied === 'name' && <span className="text-xs text-success ml-1">✓</span>}
                </h2>
              </button>
              {anketa.age && (
                <>
                  <span className="text-text-muted text-xl">,</span>
                  <button onClick={() => copy(String(anketa.age), 'age')}>
                    <h2 className="text-xl font-bold text-text">
                      {anketa.age}
                      {copied === 'age' && <span className="text-xs text-success ml-1">✓</span>}
                    </h2>
                  </button>
                </>
              )}
            </div>
            {anketa.telegram && (
              <button onClick={() => copy(anketa.telegram!, 'tg')} className="text-accent-light text-sm font-mono mt-0.5">
                {anketa.telegram} {copied === 'tg' ? '✓' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        {/* VK assign button */}
        <button
          onClick={() => setShowVkImport(true)}
          className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3"
        >
          <div className="flex items-center gap-2.5">
            <ClipboardList size={16} className="text-accent-light" />
            <span className="text-sm font-medium text-text">{t('assign_vk')}</span>
          </div>
          <span className="text-xs text-text-muted bg-bg px-2 py-1 rounded-lg">
            {citiesWithVk}/{anketa.cities.length}
          </span>
        </button>

        {/* Cities */}
        {anketa.cities.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">{t('cities_header')}</h3>
            <div className="flex flex-col gap-2">
              {anketa.cities.map((city, i) => (
                <div key={city.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* City header */}
                  <button
                    onClick={() => copy(city.city, `city-${city.id}`)}
                    className={`w-full flex items-center gap-2.5 px-4 py-3 border-b border-border text-left ${city.status === 'blocked' ? 'opacity-60' : ''}`}
                  >
                    <span className="text-text-muted text-sm font-mono">{i + 1}</span>
                    <span className="font-semibold text-text flex-1">{city.city}</span>
                    <span className="text-xs text-text-muted">{copied === `city-${city.id}` ? '✓' : ''}</span>
                    {city.status === 'blocked'
                      ? <WifiOff size={14} className="text-danger" />
                      : <Wifi size={14} className="text-success" />
                    }
                  </button>

                  {/* VK account */}
                  {city.vk ? (
                    <div className="px-4 py-3 flex flex-col gap-2">
                      <button
                        onClick={() => copy(city.vk!.login, `login-${city.id}`)}
                        className="flex items-center gap-2.5 bg-bg rounded-xl px-3 py-2.5 text-left group"
                      >
                        <Phone size={12} className="text-text-muted flex-shrink-0" />
                        <span className="text-sm text-text font-mono flex-1">{city.vk.login}</span>
                        <span className="text-xs text-text-muted group-active:text-success">
                          {copied === `login-${city.id}` ? '✓' : 'copy'}
                        </span>
                      </button>
                      <button
                        onClick={() => copy(city.vk!.password, `pass-${city.id}`)}
                        className="flex items-center gap-2.5 bg-bg rounded-xl px-3 py-2.5 text-left group"
                      >
                        <Key size={12} className="text-text-muted flex-shrink-0" />
                        <span className="text-sm text-text font-mono flex-1 break-all">{city.vk.password}</span>
                        <span className="text-xs text-text-muted group-active:text-success">
                          {copied === `pass-${city.id}` ? '✓' : 'copy'}
                        </span>
                      </button>
                      {city.vk!.userAgent && (
                        <button
                          onClick={() => copy(city.vk!.userAgent!, `ua-${city.id}`)}
                          className="flex items-center gap-2.5 bg-bg rounded-xl px-3 py-2.5 text-left group"
                        >
                          <Monitor size={12} className="text-text-muted flex-shrink-0" />
                          <span className="text-xs text-text-muted font-mono flex-1 truncate">{city.vk!.userAgent}</span>
                          <span className="text-xs text-text-muted group-active:text-success">
                            {copied === `ua-${city.id}` ? '✓' : 'copy'}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => removeVkFromCity(anketa.id, city.id)}
                        className="text-xs text-danger text-right"
                      >
                        {t('vk_detach')}
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-3 flex flex-col gap-2">
                      {manualCityId === city.id ? (
                        <>
                          <textarea
                            autoFocus
                            value={manualVkText}
                            onChange={e => setManualVkText(e.target.value)}
                            placeholder={"48699529403\nWplYqoE56WfNii5N"}
                            rows={2}
                            className="w-full bg-bg border border-border rounded-xl px-3 py-2 text-text text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleManualVk(city.id)}
                              disabled={manualVkText.trim().split('\n').filter(Boolean).length < 2}
                              className="flex-1 bg-accent rounded-xl py-2 text-white text-xs font-semibold disabled:opacity-40"
                            >
                              {t('vk_attach_btn')}
                            </button>
                            <button
                              onClick={() => { setManualCityId(null); setManualVkText('') }}
                              className="px-3 py-2 text-text-muted text-xs"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Tag size={12} className="text-text-muted" />
                            <span className="text-xs text-text-muted">{t('vk_not_assigned')}</span>
                          </div>
                          <button
                            onClick={() => { setManualCityId(city.id); setManualVkText('') }}
                            className="text-xs text-accent-light font-medium"
                          >
                            {t('vk_manual')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Apple ID Premium */}
                  <div className="px-4 py-3 border-t border-border">
                    {city.appleId ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gift size={12} className="text-accent-light" />
                          <span className="text-xs text-text-muted">{city.appleId.email}</span>
                        </div>
                        <button
                          onClick={() => removeAppleIdFromCity(anketa.id, city.id)}
                          className="text-xs text-danger text-right"
                        >
                          {t('vk_detach')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSelectedCityIdForPremium(city.id); setShowPremiumModal(true); setSelectedAppleIdIndex(null) }}
                        disabled={availableAppleIds.length === 0}
                        className="w-full flex items-center justify-center gap-2 text-xs text-accent-light font-medium disabled:opacity-40"
                      >
                        <Gift size={12} />
                        Поставить премиум
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Birth dates */}
        {anketa.birthDates.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">{t('dates_header')}</h3>
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-2">
              {anketa.birthDates.map(d => (
                <button
                  key={d}
                  onClick={() => copy(d, `date-${d}`)}
                  className="flex items-center gap-1.5 bg-bg text-text text-sm px-3 py-1.5 rounded-xl font-mono active:scale-95 transition-transform"
                >
                  <Calendar size={12} className="text-text-muted" />
                  {d}
                  {copied === `date-${d}` && <span className="text-success text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {anketa.notes && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">{t('notes_header')}</h3>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-text text-sm whitespace-pre-wrap">{anketa.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* VK Import Modal */}
      {showVkImport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowVkImport(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-surface rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-text">{t('vk_attach_title')}</h3>
              <button onClick={() => setShowVkImport(false)} className="text-text-muted">
                <X size={18} />
              </button>
            </div>
            <p className="text-text-muted text-sm mb-4">
              {t('vk_format_hint')} <span className="font-mono text-xs bg-bg px-1.5 py-0.5 rounded">ID:password:token:useragent</span> — one per line
            </p>
            <textarea
              autoFocus
              value={vkRaw}
              onChange={e => setVkRaw(e.target.value)}
              placeholder={`66639968974:Sjn6OKVGkuNK2F:...\n66835193214:9iZwO4bbAPfq6U:...`}
              rows={6}
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text text-xs placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none font-mono mb-4"
            />
            {vkMsg && (
              <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-2.5 mb-3 text-success text-sm text-center">
                {vkMsg}
              </div>
            )}
            <button
              onClick={handleVkAssign}
              disabled={!vkRaw.trim()}
              className="w-full bg-accent rounded-2xl py-3.5 text-white font-semibold disabled:opacity-40"
            >
              {t('vk_assign_random')}
            </button>
          </div>
        </div>
      )}

      {/* Premium Apple ID Selection Modal */}
      {showPremiumModal && selectedAppleIdIndex === null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowPremiumModal(false); setSelectedCityIdForPremium(null) }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-surface rounded-t-3xl p-6 pb-10 animate-slide-up border-t border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text">Выберите Apple ID</h3>
              <button onClick={() => { setShowPremiumModal(false); setSelectedCityIdForPremium(null) }} className="text-text-muted">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {availableAppleIds.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">Нет доступных Apple ID</p>
              ) : (
                availableAppleIds.map((appleId, idx) => (
                  <button
                    key={appleId.email}
                    onClick={() => setSelectedAppleIdIndex(idx)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent transition-colors text-left"
                  >
                    <Gift size={16} className="text-accent-light flex-shrink-0" />
                    <div>
                      <p className="text-sm font-mono text-text">{appleId.email}</p>
                      <p className="text-xs text-text-muted">Доступно</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Apple ID Display Overlay */}
      {showPremiumModal && selectedAppleIdIndex !== null && availableAppleIds[selectedAppleIdIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setSelectedAppleIdIndex(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-surface rounded-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text">Apple ID</h3>
              <button onClick={() => setSelectedAppleIdIndex(null)} className="text-text-muted">
                <X size={18} />
              </button>
            </div>

            {(() => {
              const appleId = availableAppleIds[selectedAppleIdIndex]
              return (
                <div className="space-y-4">
                  <div
                    onClick={() => copy(appleId.email, 'apple-email')}
                    className="p-4 bg-card border border-border rounded-2xl cursor-pointer hover:border-accent transition-colors"
                  >
                    <p className="text-xs text-text-muted mb-1">Email</p>
                    <p className="text-sm font-mono text-text break-all">{appleId.email}</p>
                    {copied === 'apple-email' && <span className="text-xs text-success ml-1">✓ скопировано</span>}
                  </div>

                  <div
                    onClick={() => copy(appleId.password, 'apple-password')}
                    className="p-4 bg-card border border-border rounded-2xl cursor-pointer hover:border-accent transition-colors"
                  >
                    <p className="text-xs text-text-muted mb-1">Пароль</p>
                    <p className="text-sm font-mono text-text break-all">{appleId.password}</p>
                    {copied === 'apple-password' && <span className="text-xs text-success ml-1">✓ скопировано</span>}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleInstalledPremium}
                      className="flex-1 bg-accent rounded-2xl py-3 text-white font-semibold"
                    >
                      <ArrowRight size={14} className="inline mr-1" />
                      Установил премиум
                    </button>
                    <button
                      onClick={() => setSelectedAppleIdIndex(null)}
                      className="px-4 py-3 text-text-muted"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
