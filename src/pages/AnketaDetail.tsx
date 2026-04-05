import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Trash2, Phone, Key, Tag, Calendar, Wifi, WifiOff, ClipboardList, X } from 'lucide-react'
import { useStore } from '@/store'
import { useState } from 'react'

export default function AnketaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { anketas, deleteAnketa, assignVkToAnketa, removeVkFromCity } = useStore()
  const [copied, setCopied] = useState<string | null>(null)
  const [showVkImport, setShowVkImport] = useState(false)
  const [vkRaw, setVkRaw] = useState('')
  const [vkMsg, setVkMsg] = useState('')

  const anketa = anketas.find(a => a.id === id)
  if (!anketa) return <div className="p-8 text-text-muted">Не найдено</div>

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const handleDelete = () => {
    if (confirm(`Удалить анкету ${anketa.name}?`)) {
      deleteAnketa(anketa.id)
      navigate(`/workers/${anketa.workerId}`)
    }
  }

  const handleVkAssign = () => {
    const msg = assignVkToAnketa(anketa.id, vkRaw)
    setVkMsg(msg)
    setVkRaw('')
    setTimeout(() => { setVkMsg(''); setShowVkImport(false) }, 2000)
  }

  const citiesWithVk = anketa.cities.filter(c => c.vk).length

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
            <h2 className="text-xl font-bold text-text">
              {anketa.name}{anketa.age ? `, ${anketa.age}` : ''}
            </h2>
            {anketa.telegram && (
              <button
                onClick={() => copy(anketa.telegram!, 'tg')}
                className="text-accent-light text-sm font-mono mt-0.5"
              >
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
            <span className="text-sm font-medium text-text">Привязать ВК аккаунты</span>
          </div>
          <span className="text-xs text-text-muted bg-bg px-2 py-1 rounded-lg">
            {citiesWithVk}/{anketa.cities.length} городов
          </span>
        </button>

        {/* Cities */}
        {anketa.cities.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Города</h3>
            <div className="flex flex-col gap-2">
              {anketa.cities.map((city, i) => (
                <div key={city.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* City header */}
                  <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-border ${city.status === 'blocked' ? 'opacity-60' : ''}`}>
                    <span className="text-text-muted text-sm font-mono">{i + 1}</span>
                    <span className="font-semibold text-text flex-1">{city.city}</span>
                    {city.status === 'blocked'
                      ? <WifiOff size={14} className="text-danger" />
                      : <Wifi size={14} className="text-success" />
                    }
                  </div>

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
                      <button
                        onClick={() => removeVkFromCity(anketa.id, city.id)}
                        className="text-xs text-danger text-right"
                      >
                        Открепить ВК
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <Tag size={12} className="text-text-muted" />
                      <span className="text-xs text-text-muted">ВК не привязан</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Birth dates */}
        {anketa.birthDates.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Даты</h3>
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-2">
              {anketa.birthDates.map(d => (
                <span key={d} className="flex items-center gap-1.5 bg-bg text-text text-sm px-3 py-1.5 rounded-xl font-mono">
                  <Calendar size={12} className="text-text-muted" />
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {anketa.notes && (
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">Заметки</h3>
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
              <h3 className="text-lg font-bold text-text">Вставить ВК аккаунты</h3>
              <button onClick={() => setShowVkImport(false)} className="text-text-muted">
                <X size={18} />
              </button>
            </div>
            <p className="text-text-muted text-sm mb-4">
              Формат: <span className="font-mono text-xs bg-bg px-1.5 py-0.5 rounded">ID:пароль:токен:юзерагент</span> — по одному на строку
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
              Привязать рандомно
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
