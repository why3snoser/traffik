import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit3, Trash2, Phone, Key, Tag, Calendar, Wifi, WifiOff, ClipboardList, X, Monitor, Gift, ArrowRight, Copy, Mail, Link2, Plus, Import, ImagePlus, Video, Play, Download, Loader2, Trash2 as Trash } from 'lucide-react'
import { useStore } from '@/store'
import { AppleIdEntry } from '@/types'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useT } from '@/i18n'
import PhotoLightbox from '@/components/PhotoLightbox'
import { compressImage, compressVideo, downloadDataUrl } from '@/lib/media'

export default function AnketaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const t = useT()
  const { anketas, deleteAnketa, assignVkToAnketa, setVkForCity, removeVkFromCity, profile, setAppleIdForCity, removeAppleIdFromCity, importAppleIds, setEmailForCity, removeEmailFromCity, loadAnketaMedia, addAnketaPhotos, removeAnketaPhoto, setAnketaVideo, removeAnketaVideo } = useStore()
  const [copied, setCopied] = useState<string | null>(null)
  const [showVkImport, setShowVkImport] = useState(false)
  const [vkRaw, setVkRaw] = useState('')
  const [vkMsg, setVkMsg] = useState('')
  const [manualCityId, setManualCityId] = useState<string | null>(null)
  const [manualVkText, setManualVkText] = useState('')
  const [emailCityId, setEmailCityId] = useState<string | null>(null)
  const [emailText, setEmailText] = useState('')
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [selectedCityIdForPremium, setSelectedCityIdForPremium] = useState<string | null>(null)
  const [premImportText, setPremImportText] = useState('')
  const [premImportMsg, setPremImportMsg] = useState('')
  const [premAddOpen, setPremAddOpen] = useState(false)
  const [photoViewer, setPhotoViewer] = useState<number | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [videoBusy, setVideoBusy] = useState(false)
  const [videoMsg, setVideoMsg] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) loadAnketaMedia(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const anketa = anketas.find(a => a.id === id)
  if (!anketa) return <div className="p-8 text-text-muted">Не найдено</div>

  const handleAddPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setPhotoBusy(true)
    try {
      const results = await Promise.all(
        Array.from(files).map(f => compressImage(f, 1280, 0.8))
      )
      await addAnketaPhotos(anketa.id, results)
    } catch (e) {
      console.error(e)
    } finally {
      setPhotoBusy(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleSetVideo = async (file: File | undefined) => {
    if (!file) return
    setVideoBusy(true)
    setVideoMsg(null)
    try {
      const { dataUrl } = await compressVideo(file, 7)
      await setAnketaVideo(anketa.id, dataUrl)
    } catch (e) {
      setVideoMsg(e instanceof Error && e.message === 'VIDEO_TOO_LONG' ? t('video_too_long') : t('video_error'))
    } finally {
      setVideoBusy(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const videoSrc = anketa.videos?.[0]

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

  const handleSetEmail = async (cityId: string) => {
    const email = emailText.trim()
    if (!email) return
    await setEmailForCity(anketa.id, cityId, email)
    setEmailCityId(null)
    setEmailText('')
  }

  const handleInstallPremium = async (appleId: AppleIdEntry) => {
    if (!selectedCityIdForPremium) return
    await setAppleIdForCity(anketa.id, selectedCityIdForPremium, appleId)
    setShowPremiumModal(false)
    setSelectedCityIdForPremium(null)
  }

  const handleImportPremium = async () => {
    if (!premImportText.trim()) return
    const msg = await importAppleIds(premImportText)
    setPremImportMsg(msg)
    if (msg.startsWith('Импорт')) setPremImportText('')
    setTimeout(() => setPremImportMsg(''), 2500)
  }

  const citiesWithVk = anketa.cities.filter(c => c.vk).length

  // Emails currently bound to any city — these accounts are "busy"
  const occupiedAppleEmails = useMemo(() => {
    const set = new Set<string>()
    anketas.forEach(a => a.cities.forEach(c => { if (c.appleId?.email) set.add(c.appleId.email) }))
    return set
  }, [anketas])

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

                  {/* Email binding */}
                  <div className="px-4 py-3 border-t border-border">
                    {city.email ? (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => copy(city.email!, `email-${city.id}`)}
                          className="flex items-center gap-2 bg-bg rounded-xl px-3 py-2.5 text-left flex-1 min-w-0 group"
                        >
                          <Mail size={12} className="text-accent-light flex-shrink-0" />
                          <span className="text-sm text-text font-mono flex-1 truncate">{city.email}</span>
                          <span className="text-xs text-text-muted group-active:text-success">
                            {copied === `email-${city.id}` ? '✓' : 'copy'}
                          </span>
                        </button>
                        <button
                          onClick={() => removeEmailFromCity(anketa.id, city.id)}
                          className="text-xs text-danger text-right flex-shrink-0"
                        >
                          Отвязать
                        </button>
                      </div>
                    ) : emailCityId === city.id ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          value={emailText}
                          onChange={e => setEmailText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSetEmail(city.id) }}
                          placeholder="Введите почту"
                          inputMode="email"
                          className="flex-1 bg-bg border border-border rounded-xl px-3 py-2 text-text text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent min-w-0"
                        />
                        <button
                          onClick={() => handleSetEmail(city.id)}
                          disabled={!emailText.trim()}
                          className="flex-shrink-0 bg-accent rounded-xl px-3 py-2 text-white text-xs font-semibold disabled:opacity-40"
                        >
                          {t('vk_attach_btn')}
                        </button>
                        <button
                          onClick={() => { setEmailCityId(null); setEmailText('') }}
                          className="flex-shrink-0 px-1 py-2 text-text-muted text-xs"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEmailCityId(city.id); setEmailText('') }}
                        className="w-full flex items-center justify-center gap-2 text-xs text-accent-light font-medium"
                      >
                        <Mail size={12} />
                        Привязать почту
                      </button>
                    )}
                  </div>

                  {/* Apple ID Premium */}
                  <div className="px-4 py-3 border-t border-border">
                    {city.appleId ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Gift size={12} className="text-accent-light" />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-accent-light">Premium привязан</span>
                          </div>
                          <button
                            onClick={() => removeAppleIdFromCity(anketa.id, city.id)}
                            className="text-xs text-danger text-right"
                          >
                            Отвязать премиум
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => copy(city.appleId!.email, `be-${city.id}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg border border-border text-[10px] font-mono text-text"
                          >
                            {city.appleId.email}
                            {copied === `be-${city.id}` && <span className="text-success">✓</span>}
                          </button>
                          <button
                            onClick={() => copy(city.appleId!.password, `bp-${city.id}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg border border-border text-[10px] font-mono text-text-muted"
                          >
                            <Key size={11} /> {city.appleId.password}
                            {copied === `bp-${city.id}` && <span className="text-success">✓</span>}
                          </button>
                          {city.appleId.mailPassword && (
                            <button
                              onClick={() => copy(city.appleId!.mailPassword!, `bmp-${city.id}`)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg border border-border text-[10px] font-mono text-text-muted"
                            >
                              <Mail size={11} /> {city.appleId.mailPassword}
                              {copied === `bmp-${city.id}` && <span className="text-success">✓</span>}
                            </button>
                          )}
                          {city.appleId.smsLink && (
                            <a
                              href={city.appleId.smsLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 border border-accent/20 text-[10px] font-medium text-accent-light"
                            >
                              <Link2 size={11} /> Получить код
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSelectedCityIdForPremium(city.id); setShowPremiumModal(true) }}
                        className="w-full flex items-center justify-center gap-2 text-xs text-accent-light font-medium"
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

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t('photos_header')}</h3>
            {anketa.photos.length > 0 && (
              <span className="text-xs text-text-muted">{anketa.photos.length}</span>
            )}
          </div>

          {anketa.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {anketa.photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoViewer(i)}
                  className="aspect-square rounded-2xl overflow-hidden bg-card border border-border active:scale-[0.97] transition-transform"
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleAddPhotos(e.target.files)}
          />
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={photoBusy}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-2xl py-3 text-text-muted text-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
          >
            {photoBusy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            {t('photos_add')}
          </button>
        </div>

        {/* Verification video */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">{t('video_header')}</h3>

          {videoSrc ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <video src={videoSrc} controls className="w-full aspect-video bg-black/40" />
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-text-muted flex items-center gap-1.5">
                  <Video size={13} className="text-accent-light" />
                  {t('video_uploaded')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadDataUrl(videoSrc, `video-${anketa.name}.webm`)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent-light px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/20"
                  >
                    <Download size={12} />
                    {t('photo_download')}
                  </button>
                  <button
                    onClick={() => removeAnketaVideo(anketa.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-danger px-3 py-1.5 rounded-xl bg-danger/10 border border-danger/20"
                  >
                    <Trash size={12} />
                    {t('video_delete')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {videoMsg && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5 text-danger text-sm text-center">
                  {videoMsg}
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => handleSetVideo(e.target.files?.[0])}
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={videoBusy}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-2xl py-3 text-text-muted text-sm hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
              >
                {videoBusy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {t('video_add')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VK Import Modal */}
      {showVkImport && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowVkImport(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full max-w-lg bg-surface rounded-t-3xl p-6 pb-10 animate-pop border-t border-border"
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

      {/* Photo lightbox */}
      {photoViewer !== null && anketa.photos[photoViewer] && (
        <PhotoLightbox
          photos={anketa.photos}
          index={photoViewer}
          onClose={() => setPhotoViewer(null)}
          onDelete={idx => removeAnketaPhoto(anketa.id, idx)}
        />
      )}

      {/* Premium Apple ID Selection Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => { setShowPremiumModal(false); setSelectedCityIdForPremium(null) }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full max-w-lg bg-surface rounded-t-3xl p-6 pb-10 animate-pop border-t border-border flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-text">Apple ID для премиума</h3>
              <button onClick={() => { setShowPremiumModal(false); setSelectedCityIdForPremium(null) }} className="text-text-muted">
                <X size={18} />
              </button>
            </div>
            <p className="text-text-muted text-xs mb-3">Нажми на email/пароль, чтобы скопировать. Занятые выделены серым.</p>

            {/* Add / import accounts */}
            <button
              onClick={() => setPremAddOpen(o => !o)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl mb-3 text-xs font-semibold bg-accent/15 border border-accent/30 text-accent-light"
            >
              <Plus size={13} />
              {premAddOpen ? 'Скрыть' : 'Добавить / импортировать Apple ID'}
            </button>
            {premAddOpen && (
              <div className="mb-3 space-y-2">
                <textarea
                  autoFocus
                  value={premImportText}
                  onChange={e => setPremImportText(e.target.value)}
                  placeholder={'Вставь список:\nПочта: ...\nПароль: ...\nПароль от почты: ...\nузнать код: https://...'}
                  rows={4}
                  className="w-full bg-card border border-border rounded-2xl px-3 py-2 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none font-mono"
                />
                {premImportMsg && <p className="text-[11px] text-success px-1">{premImportMsg}</p>}
                <button
                  onClick={handleImportPremium}
                  disabled={!premImportText.trim()}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-accent text-white disabled:opacity-40"
                >
                  <Import size={13} />
                  Импортировать в список
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
              {(profile.appleIds ?? []).length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">Список пуст. Добавь аккаунты выше.</p>
              ) : (
                (profile.appleIds ?? []).map(appleId => {
                  const occupied = occupiedAppleEmails.has(appleId.email)
                  return (
                    <div
                      key={appleId.email}
                      className={`rounded-2xl p-3 border transition-colors ${occupied ? 'bg-black/20 border-border opacity-60' : 'bg-card border-border'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${occupied ? 'bg-white/10 text-text-muted' : 'bg-accent/15 text-accent-light'}`}>
                            {occupied ? 'Занята' : 'Свободна'}
                          </span>
                          <span className="text-xs font-mono text-text truncate">{appleId.email}</span>
                        </div>
                        <button
                          onClick={() => handleInstallPremium(appleId)}
                          disabled={occupied}
                          className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity ${occupied ? 'opacity-40' : 'bg-accent text-white'}`}
                        >
                          <ArrowRight size={12} />
                          Установить
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => copy(appleId.email, `a-${appleId.email}`)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg border border-border text-[10px] font-mono text-text"
                        >
                          <Copy size={11} /> {appleId.email}
                          {copied === `a-${appleId.email}` && <span className="text-success">✓</span>}
                        </button>
                        <button
                          onClick={() => copy(appleId.password, `ap-${appleId.email}`)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg border border-border text-[10px] font-mono text-text-muted"
                        >
                          <Key size={11} /> {appleId.password}
                          {copied === `ap-${appleId.email}` && <span className="text-success">✓</span>}
                        </button>
                        {appleId.mailPassword && (
                          <button
                            onClick={() => copy(appleId.mailPassword!, `amp-${appleId.email}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-bg border border-border text-[10px] font-mono text-text-muted"
                          >
                            <Mail size={11} /> {appleId.mailPassword}
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
                            <Link2 size={11} /> Получить код
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
