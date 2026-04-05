import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calculator } from 'lucide-react'
import { useStore } from '@/store'
import { ProfitType, PROFIT_LABELS, PROFIT_PERCENTS, calcMyShare, rubToUsd, usdToUah, fmtUsd, fmtUah } from '@/types'

const TYPES: ProfitType[] = ['oplata', 'perevod', 'iks', 'vozvrat', 'vozvrat_yurist']

export default function ProfitForm() {
  const navigate = useNavigate()
  const { workerId } = useParams<{ workerId: string }>()
  const { addProfit, workers, anketas, profile } = useStore()
  const { rubToUsd: r2u, usdToUah: u2ua } = profile.settings

  const worker = workers.find(w => w.id === workerId)
  const myAnketas = anketas.filter(a => a.workerId === workerId)

  const [amount, setAmount] = useState('')
  const [type, setType] = useState<ProfitType>('oplata')
  const [note, setNote] = useState('')
  const [anketaId, setAnketaId] = useState('')

  const amountNum = parseFloat(amount.replace(',', '.')) || 0
  const myShareRub = calcMyShare(amountNum, type)
  const myShareUsd = rubToUsd(myShareRub, r2u)
  const myShareUah = usdToUah(myShareUsd, u2ua)

  const handleSave = () => {
    if (!amountNum || !workerId) return
    addProfit(workerId, amountNum, type, note || undefined, anketaId || undefined)
    navigate(`/workers/${workerId}`)
  }

  return (
    <div className="pb-28">
      <div className="px-4 pt-6 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-text-muted">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text">Добавить профит</h1>
            {worker && <p className="text-text-muted text-sm">{worker.emoji} {worker.name}</p>}
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-5">
        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Сумма профита</label>
          <div className="relative">
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-2xl font-bold text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">₽</span>
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Тип</label>
          <div className="flex flex-col gap-2">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${type === t ? 'bg-accent-glow border-accent/40 text-text' : 'bg-card border-border text-text-muted'}`}
              >
                <span className="text-sm font-medium">{PROFIT_LABELS[t]}</span>
                <span className={`text-sm font-bold ${type === t ? 'text-accent-light' : ''}`}>
                  {PROFIT_PERCENTS[t] * 100}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {amountNum > 0 && (
          <div className="bg-gradient-to-r from-success/10 to-accent/10 border border-success/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={16} className="text-success" />
              <span className="text-sm font-semibold text-text">Твоя доля</span>
            </div>
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Профит</span>
                <span>{amountNum.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>× {PROFIT_PERCENTS[type] * 100}% ÷ 2</span>
                <span>{myShareRub.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex justify-between">
                <span className="text-text font-semibold">Итого</span>
                <div className="text-right">
                  <span className="text-success font-bold text-lg">{fmtUsd(myShareUsd)}</span>
                  <p className="text-text-muted text-xs">{fmtUah(myShareUah)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anketa */}
        {myAnketas.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">
              Анкета (необязательно)
            </label>
            <select
              value={anketaId}
              onChange={e => setAnketaId(e.target.value)}
              className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors"
            >
              <option value="">Не привязывать</option>
              {myAnketas.map(a => (
                <option key={a.id} value={a.id}>{a.name}{a.age ? `, ${a.age}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2 px-1">Заметка</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Необязательно..."
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={!amountNum}
          className="w-full bg-accent rounded-2xl py-4 text-white font-semibold text-base disabled:opacity-40 active:scale-[0.98] transition-transform shadow-glow"
        >
          {amountNum > 0 ? `Сохранить — ${fmtUsd(myShareUsd)}` : 'Введи сумму'}
        </button>
      </div>
    </div>
  )
}
