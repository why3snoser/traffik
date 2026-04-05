import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useStore } from '@/store'
import { CityEntry } from '@/types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function AnketaForm() {
  const navigate = useNavigate()
  const { workerId, id } = useParams<{ workerId?: string; id?: string }>()
  const { anketas, addAnketa, updateAnketa } = useStore()
  const existing = id ? anketas.find(a => a.id === id) : null
  const wId = workerId ?? existing?.workerId ?? ''

  const [name, setName] = useState(existing?.name ?? '')
  const [age, setAge] = useState(existing?.age?.toString() ?? '')
  const [telegram, setTelegram] = useState(existing?.telegram ?? '')
  const [cities, setCities] = useState<CityEntry[]>(
    existing?.cities ?? [{ id: uid(), city: '', status: 'active' }]
  )
  const [cityBulk, setCityBulk] = useState('')
  const [showCityBulk, setShowCityBulk] = useState(false)
  const [birthDates, setBirthDates] = useState<string[]>(existing?.birthDates ?? [])
  const [dateInput, setDateInput] = useState('')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  const addCity = () => setCities([...cities, { id: uid(), city: '', status: 'active' }])
  const removeCity = (cid: string) => setCities(cities.filter(c => c.id !== cid))
  const updateCity = (cid: string, val: string) =>
    setCities(cities.map(c => c.id === cid ? { ...c, city: val } : c))
  const toggleStatus = (cid: string) =>
    setCities(cities.map(c => c.id === cid ? { ...c, status: c.status === 'active' ? 'blocked' : 'active' } : c))

  const handleSave = () => {
    if (!name.trim() || !wId) return
    const data = {
      workerId: wId,
      name: name.trim(),
      age: age ? parseInt(age) : undefined,
      telegram: telegram.trim() || undefined,
      cities: cities.filter(c => c.city.trim()),
      birthDates,
      notes: notes.trim() || undefined,
    }
    if (existing) {
      updateAnketa(existing.id, data)
      navigate(`/anketas/${existing.id}`)
    } else {
      addAnketa(data)
      navigate(`/workers/${wId}`)
    }
  }

  return (
    <div className="pb-32">
      <div className="px-4 pt-6 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-text flex-1">
            {existing ? 'Редактировать' : 'Новая анкета'}
          </h1>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5">
        {/* Name + Age */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Имя</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Анна"
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="w-24">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Возраст</label>
            <input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="25"
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {/* Telegram */}
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Telegram</label>
          <input
            type="text"
            value={telegram}
            onChange={e => setTelegram(e.target.value)}
            placeholder="@username"
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors font-mono"
          />
        </div>

        {/* Cities */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Города</label>
            <button
              onClick={() => setShowCityBulk(!showCityBulk)}
              className="text-xs text-accent-light font-medium"
            >
              {showCityBulk ? 'По одному' : 'Вставить списком'}
            </button>
          </div>

          {showCityBulk ? (
            <div className="relative">
              <textarea
                autoFocus
                value={cityBulk}
                onChange={e => setCityBulk(e.target.value)}
                placeholder={'Москва\nСанкт-Петербург\nНовосибирск\n...по одному городу на строку'}
                rows={5}
                className="w-full bg-card border border-border rounded-2xl px-4 py-3 pr-14 text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none text-sm"
              />
              <button
                onClick={() => {
                  const newCities = cityBulk
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l)
                    .map(name => ({ id: uid(), city: name, status: 'active' as const }))
                  if (newCities.length) {
                    setCities([...cities.filter(c => c.city), ...newCities])
                    setCityBulk('')
                    setShowCityBulk(false)
                  }
                }}
                className="absolute right-3 bottom-3 w-9 h-9 rounded-xl bg-accent flex items-center justify-center"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          ) : (
          <div className="flex flex-col gap-2">
            {cities.map((city, i) => (
              <div key={city.id} className="flex items-center gap-2">
                <span className="text-text-muted text-sm w-5 text-center flex-shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={city.city}
                  onChange={e => updateCity(city.id, e.target.value)}
                  placeholder="Город"
                  className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={() => toggleStatus(city.id)}
                  className={`text-base flex-shrink-0 ${city.status === 'blocked' ? 'opacity-100' : 'opacity-30'}`}
                  title={city.status === 'blocked' ? 'Заблокирован' : 'Активный'}
                >
                  ✖️
                </button>
                {cities.length > 1 && (
                  <button onClick={() => removeCity(city.id)} className="text-text-muted flex-shrink-0">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addCity}
              className="flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-2.5 text-text-muted text-sm hover:border-accent hover:text-accent transition-colors"
            >
              <Plus size={14} />
              Добавить город
            </button>
          </div>
          )}
        </div>

        {/* Dates */}
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Даты рождения</label>
          <div className="relative mb-2">
            <textarea
              value={dateInput}
              onChange={e => setDateInput(e.target.value)}
              placeholder={'07.03.2000\n11.18.2000\n01.27.2001\n...можно вставить сразу несколько'}
              rows={3}
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 pr-14 text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors font-mono resize-none text-sm"
            />
            <button
              onClick={() => {
                const lines = dateInput.split('\n').map(l => l.trim()).filter(l => l && !birthDates.includes(l))
                if (lines.length) setBirthDates([...birthDates, ...lines])
                setDateInput('')
              }}
              className="absolute right-3 bottom-3 w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0"
            >
              <Plus size={16} className="text-white" />
            </button>
          </div>
          {birthDates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {birthDates.map(d => (
                <span key={d} className="flex items-center gap-1.5 bg-card border border-border text-text text-sm px-3 py-1.5 rounded-xl font-mono">
                  {d}
                  <button onClick={() => setBirthDates(birthDates.filter(x => x !== d))}>
                    <X size={12} className="text-text-muted" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Заметки</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Доп. информация..."
            rows={3}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full bg-accent rounded-2xl py-4 text-white font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform shadow-glow"
        >
          {existing ? 'Сохранить' : 'Создать анкету'}
        </button>
      </div>
    </div>
  )
}
