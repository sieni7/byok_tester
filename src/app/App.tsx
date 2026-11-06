import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { providers } from '../core/provider-registry'
import { loadCredentials, saveCredentials } from '../services/credential-service'
import { sendNvidiaChatCompletion } from '../services/nvidia-chat-service'
import { nvidiaModels } from '../core/nvidia-models'
import type { CredentialStorageMode } from '../services/credential-service'
import type { ChatMessage, Provider, ProviderId } from '../types'

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: 'Bienvenue dans Keydock alpha.3. NVIDIA NIM est le premier fournisseur réellement connecté. Ajoutez votre clé NVIDIA, puis envoyez un prompt.',
    meta: 'Keydock assistant · maintenant',
  },
  {
    id: 2,
    role: 'assistant',
    text: 'Votre prompt passe par le proxy Netlify de Keydock avant d’être transmis à NVIDIA NIM ; cette alpha prend en charge une requête texte ponctuelle.',
    meta: 'NVIDIA NIM · requête directe à la demande',
  },
]

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    key: <><path d="M21 2 13.6 9.4" /><circle cx="8.5" cy="15.5" r="5.5" /><path d="m12.5 11.5 2 2m-5-1 2 2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" /><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M8 7h7m-7 4h5" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1A1.7 1.7 0 0 1 7.7 3.3l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l-.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
    plus: <><path d="M12 5v14m-7-7h14" /></>,
    paperclip: <path d="m20.5 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.2-8.2a3.4 3.4 0 0 1 4.8 4.8l-8.2 8.2a1.8 1.8 0 0 1-2.5-2.5l7.6-7.6" />,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-3 0h6" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></>,
    eye: <><path d="M2.5 12s3.2-5 9.5-5 9.5 5 9.5 5-3.2 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.2" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.3 0 9.5 6 9.5 6a17 17 0 0 1-2.1 2.7M6.3 6.9C3.7 8.8 2.5 12 2.5 12S5.7 18 12 18a9.5 9.5 0 0 0 3.1-.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
    trash: <><path d="M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14" /></>,
    shield: <><path d="M12 3 20 6v5c0 5.2-3.4 8.8-8 10-4.6-1.2-8-4.8-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    chevron: <path d="m7 9 5 5 5-5" />,
    sparkle: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Zm7 12 .5 2.5L22 18l-2.5.5L19 21l-.5-2.5L16 18l2.5-.5L19 15Z" /></>,
    external: <><path d="M14 4h6v6m-1-5-8 8" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  }
  return <svg {...common} aria-hidden="true">{paths[name]}</svg>
}

function App() {
  const [storageMode, setStorageMode] = useState<CredentialStorageMode>('session')
  const [keys, setKeys] = useState<Record<ProviderId, string>>(() => loadCredentials('session'))
  const [activeProvider, setActiveProvider] = useState<ProviderId>('nvidia')
  const [openEditor, setOpenEditor] = useState<ProviderId | null>(null)
  const [draftKey, setDraftKey] = useState('')
  const [revealed, setRevealed] = useState<Set<ProviderId>>(new Set())
  const [copied, setCopied] = useState<ProviderId | null>(null)
  const [copyError, setCopyError] = useState<ProviderId | null>(null)
  const [storageFeedback, setStorageFeedback] = useState<'saved' | 'error' | null>(null)
  const [keyEditorError, setKeyEditorError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draftMessage, setDraftMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendFeedback, setSendFeedback] = useState<string | null>(null)
  const sendingLock = useRef(false)
  const configuredCount = useMemo(() => Number(Boolean(keys.nvidia)), [keys.nvidia])

  useEffect(() => {
    if (storageMode === 'session') {
      setStorageFeedback(null)
      return
    }
    setStorageFeedback(saveCredentials(keys, 'local') ? 'saved' : 'error')
  }, [keys, storageMode])

  const fallbackProvider = providers.slice(0, 1)[0]!
  const configuredProvider = providers.find((provider) => provider.id === activeProvider) ?? fallbackProvider
  const beginAdd = () => beginEdit('nvidia')

  const changeStorageMode = (mode: CredentialStorageMode) => {
    if (mode === storageMode) return
    const hasVolatileKeys = Object.values(keys).some(Boolean)
    if (hasVolatileKeys) {
      const message = mode === 'local'
        ? 'Passer au stockage local remplacera les clés actuellement en mémoire par celles déjà enregistrées localement (ou par une liste vide). Continuer ?'
        : 'Revenir au mode session remplacera les clés actuellement affichées par une session vide. Les clés déjà enregistrées localement resteront dans le navigateur. Continuer ?'
      if (!window.confirm(message)) return
    }
    setStorageMode(mode)
    setKeys(loadCredentials(mode))
    setOpenEditor(null)
    setDraftKey('')
    setKeyEditorError(null)
    setRevealed(new Set())
  }

  const beginEdit = (provider: ProviderId) => {
    setOpenEditor(provider)
    setDraftKey(keys[provider])
    setKeyEditorError(null)
  }

  const saveKey = () => {
    if (!openEditor) return
    const normalizedKey = draftKey.trim()
    if (!normalizedKey) {
      setKeyEditorError('Saisissez une clé API avant de l’enregistrer. Pour retirer une clé existante, utilisez « Supprimer ».')
      return
    }
    if (keys[openEditor] && keys[openEditor] !== normalizedKey) {
      const confirmed = window.confirm('Remplacer la clé actuellement enregistrée dans Keydock ? La nouvelle clé remplacera uniquement la copie conservée par cette application.')
      if (!confirmed) return
    }
    setKeys((current) => ({ ...current, [openEditor]: normalizedKey }))
    setOpenEditor(null)
    setDraftKey('')
    setKeyEditorError(null)
  }

  const deleteKey = (provider: ProviderId) => {
    if (!keys[provider]) return
    const confirmed = window.confirm('Supprimer la copie de cette clé conservée dans Keydock ? Cette action ne révoque pas la clé auprès du fournisseur. Pour la rendre inutilisable, révoquez-la aussi depuis le compte NVIDIA.')
    if (!confirmed) return
    setKeys((current) => ({ ...current, [provider]: '' }))
    if (activeProvider === provider) setActiveProvider(fallbackProvider.id)
  }

  const toggleReveal = (provider: ProviderId) => {
    setRevealed((current) => {
      const next = new Set(current)
      if (next.has(provider)) next.delete(provider)
      else next.add(provider)
      return next
    })
  }

  const copyKey = async (provider: ProviderId) => {
    if (!keys[provider]) return
    setCopied(null)
    setCopyError(null)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(keys[provider])
      setCopied(provider)
      window.setTimeout(() => setCopied((current) => current === provider ? null : current), 1600)
    } catch {
      setCopyError(provider)
    }
  }

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    if (sendingLock.current || isSending) return

    const text = draftMessage.trim()
    if (!text) {
      setSendError('Saisissez un prompt avant de lancer le test.')
      setSendFeedback(null)
      return
    }
    if (activeProvider !== 'nvidia') {
      setSendError('Ce fournisseur n’est pas encore disponible. Seul NVIDIA NIM peut être testé actuellement.')
      setSendFeedback(null)
      return
    }
    if (!keys.nvidia) {
      setSendError('Ajoutez une clé NVIDIA NIM dans le gestionnaire de clés avant l’envoi.')
      setSendFeedback(null)
      return
    }
    sendingLock.current = true
    setIsSending(true)
    setSendError(null)
    setSendFeedback(null)

    try {
      const model = nvidiaModels[0]!
      const response = await sendNvidiaChatCompletion({
        apiKey: keys.nvidia,
        prompt: text,
        model: model.id,
      })
      const requestId = Date.now()
      setMessages((current) => [
        ...current,
        { id: requestId, role: 'user', text },
        {
          id: requestId + 1,
          role: 'assistant',
          text: response,
          meta: 'NVIDIA NIM · ' + model.label,
        },
      ])
      setSendFeedback('Réponse reçue de NVIDIA NIM. Votre prompt est conservé : vous pouvez le modifier ou le renvoyer.')
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Une erreur inattendue est survenue pendant l’appel NVIDIA.')
    } finally {
      sendingLock.current = false
      setIsSending(false)
    }
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /><span /></div>
          <div>
            <div className="brand-name">keydock<span>.</span></div>
            <div className="brand-caption">BYOK manager</div>
          </div>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">L</div>
          <div className="workspace-copy">
            <span>Workspace</span>
            <strong>Local sandbox</strong>
          </div>
          <Icon name="chevron" size={15} />
        </div>

        <nav className="main-nav" aria-label="Navigation principale">
          <p className="nav-label">Workspace</p>
          <a className="nav-item active" href="#chat-title"><Icon name="grid" /><span>Test NVIDIA</span><span className="nav-count">01</span></a>
          <a className="nav-item" href="#providers"><Icon name="key" /><span>Clés API</span><span className="nav-count live">{configuredCount}</span></a>
          <a className="nav-item" href="#settings"><Icon name="settings" /><span>Confidentialité</span></a>
        </nav>

        <div className="sidebar-bottom">
          <div className="vault-note">
            <div className="vault-icon"><Icon name="shield" size={17} /></div>
            <div><strong>Local vault</strong><span>Vos secrets restent ici.</span></div>
          </div>
          <div className="profile-row"><div className="profile-avatar">A</div><div><strong>Alex Morgan</strong><span>Personal workspace</span></div><span className="more-dots">•••</span></div>
        </div>
      </aside>

      <main className="workspace" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div className="crumbs"><span>Workspace</span><b>/</b><strong>Dashboard</strong></div>
          <nav className="mobile-nav" aria-label="Accès rapide"><a href="#chat-title">Test</a><a href="#providers">Clés API</a><a href="#settings">Confidentialité</a></nav>
          <div className="topbar-actions">
            <div className="sync-status"><i /> {storageMode === 'session' ? 'session · volatile' : storageFeedback === 'error' ? 'stockage local indisponible' : 'stockage local du navigateur'}</div>
            <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} aria-pressed={theme === 'dark'}>
              {theme === 'dark' ? '☀ Mode clair' : '☾ Mode sombre'}
            </button>

          </div>
        </header>

        <section className="intro-row">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> KEYDOCK · ALPHA.3</div>
            <h1>NVIDIA NIM.<br /><em>First, for real.</em></h1>
            <p className="intro-copy">Le premier parcours réel de Keydock : tester NVIDIA NIM avec votre propre clé, dans un environnement BYOK.</p>
          </div>
          <div className="intro-stats">
            <div className="stat-block"><strong>{configuredCount}</strong><span>clé NVIDIA configurée</span></div>
            <div className="stat-divider" />
            <div className="stat-block"><strong>{storageMode === 'session' ? 'RAM' : '100%'}</strong><span>{storageMode === 'session' ? 'volatile session' : 'local storage'}</span></div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="chat-card" aria-labelledby="chat-title">
            <div className="chat-card-head">
              <div><div className="section-kicker light"><span className="pulse-dot" /> FOURNISSEUR ACTIF · ALPHA.3</div><h2 id="chat-title">Tester NVIDIA NIM</h2></div>
              <span className="small-control" aria-label="État du fournisseur : NVIDIA NIM opérationnel"><span className="status-dot" /> NVIDIA opérationnel</span>
            </div>
            <div className="chat-context">
              <div className="mini-model-icon">{configuredProvider?.shortName}</div>
              <div><span>Premier fournisseur réellement intégré</span><strong>{configuredProvider?.name} · {nvidiaModels[0]?.label}</strong></div><span className="provider-live-label">ACTIF</span>
            </div>
            <div className="messages" role="log" aria-label="Échanges avec NVIDIA NIM" aria-live="polite" aria-relevant="additions">
              {messages.map((message) => (
                <div className={`message-row ${message.role}`} key={message.id}>
                  {message.role === 'assistant' && <div className="assistant-avatar"><span /><span /><span /></div>}
                  <div className="message-stack"><div className="message-bubble">{message.text}</div>{message.meta && <span className="message-meta">{message.meta}</span>}</div>
                </div>
              ))}
            </div>
            {sendError && <div className="chat-error" role="alert">{sendError}</div>}{sendFeedback && <div className="chat-success" role="status">{sendFeedback}</div>}{isSending && <div className="chat-loading" role="status">NVIDIA NIM traite votre demande…</div>}
            {activeProvider === 'nvidia' && <div className="nvidia-notice">Connexion NVIDIA NIM via le proxy Netlify de Keydock · votre clé est transmise temporairement au proxy, sans stockage ni journalisation applicative. Requête ponctuelle : pas encore d’historique multi-tour, de pièce jointe ni de streaming.</div>}
            <form className="composer" onSubmit={handleSend}>
              <textarea value={draftMessage} onChange={(event) => { setDraftMessage(event.target.value); setSendError(null); setSendFeedback(null) }} placeholder={activeProvider === 'nvidia' ? 'Envoyer un prompt à NVIDIA NIM…' : 'Ce fournisseur sera bientôt disponible…'} rows={2} aria-label="Prompt à envoyer à NVIDIA NIM" aria-invalid={Boolean(sendError)} aria-describedby="prompt-help" disabled={isSending} onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); if (!isSending && draftMessage.trim()) event.currentTarget.form?.requestSubmit() } }} />
              <div className="composer-actions">
                <span className="tool-hint">Ctrl + Entrée (ou ⌘ + Entrée) pour tester</span>
                <button className="send-button" type="submit" aria-label={isSending ? 'Envoi en cours' : 'Envoyer le prompt à NVIDIA NIM'} disabled={isSending || !draftMessage.trim()}>{isSending ? 'Envoi…' : <Icon name="arrow" size={18} />}</button>
              </div>
            </form>
            <p className="sr-only" id="prompt-help">Saisissez un prompt. Ctrl et Entrée, ou Commande et Entrée sur Mac, lance le test.</p>
            <div className="chat-footnote"><Icon name="shield" size={13} /> Les échanges restent dans cette session de navigateur.</div>
          </section>

          <section className="keys-area" id="providers" aria-labelledby="keys-title">
            <div className="keys-head"><div><div className="section-kicker">FOURNISSEUR DE L’ALPHA.3</div><h2 id="keys-title">NVIDIA d’abord</h2></div><button className="add-key-button" type="button" onClick={beginAdd}><Icon name="plus" size={16} /> Ajouter une clé</button></div>
            <div className="keys-summary"><div className="summary-main"><div className="summary-icon"><Icon name="key" size={19} /></div><div><strong>{configuredCount === 0 ? 'Aucune clé NVIDIA' : 'Clé NVIDIA configurée'}</strong><span>{storageMode === 'session' ? 'En mémoire · effacée au rechargement' : 'Enregistrée dans ce navigateur'}</span></div></div><div className="summary-badge"><span /> {storageMode === 'session' ? 'session temporaire' : 'stockage local*'}</div></div>
            <div className="credential-mode-section" id="settings">
              <div className="storage-mode-heading"><strong>Où conserver votre clé API ?</strong><span>Choisissez le mode de conservation. Vous pourrez en changer à tout moment.</span></div>
              <div className="credential-mode-options" role="group" aria-label="Mode de conservation des identifiants">
                <button type="button" className={`credential-mode-option ${storageMode === 'session' ? 'selected' : ''}`} aria-pressed={storageMode === 'session'} onClick={() => changeStorageMode('session')}>
                  <span className="mode-option-title">Session uniquement <span className="mode-recommended">Recommandé</span></span>
                  <span className="mode-option-description">La clé reste en mémoire vive. Elle disparaît au rechargement ou à la fermeture de l’onglet. Rien n’est écrit dans le stockage persistant du navigateur.</span>
                </button>
                <button type="button" className={`credential-mode-option ${storageMode === 'local' ? 'selected' : ''}`} aria-pressed={storageMode === 'local'} onClick={() => changeStorageMode('local')}>
                  <span className="mode-option-title">Stockage local du navigateur</span>
                  <span className="mode-option-description">La clé est conservée dans le localStorage de ce navigateur entre les visites. Ce stockage n’est pas chiffré et ne constitue pas un coffre-fort sécurisé.</span>
                </button>
              </div>
            </div>
            {storageMode === 'session'
              ? <p className="storage-feedback session" role="status">Mode session actif : aucune clé n’est lue depuis ou écrite dans le stockage persistant du navigateur.</p>
              : <p className={`storage-feedback ${storageFeedback === 'error' ? 'error' : 'success'}`} role={storageFeedback === 'error' ? 'alert' : 'status'}>{storageFeedback === 'error' ? 'Stockage local indisponible : le navigateur bloque l’accès à localStorage. La clé reste utilisable en mémoire dans cet onglet, mais elle ne sera pas conservée après rechargement. Vous pouvez repasser en mode session.' : storageFeedback === 'saved' ? 'Enregistrement local confirmé dans ce navigateur. Attention : la clé n’est pas chiffrée.' : 'Vérification du stockage local…'}</p>}
            <div className="provider-list">
              {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} value={keys[provider.id]} isOperational={provider.id === 'nvidia'} isActive={activeProvider === provider.id} isOpen={openEditor === provider.id} draftKey={draftKey} keyEditorError={keyEditorError} storageMode={storageMode} revealed={revealed.has(provider.id)} copied={copied === provider.id} copyError={copyError === provider.id} onActivate={() => setActiveProvider(provider.id)} onEdit={() => beginEdit(provider.id)} onDraft={(value) => { setDraftKey(value); setKeyEditorError(null) }} onSave={saveKey} onCancel={() => { setOpenEditor(null); setKeyEditorError(null) }} onReveal={() => toggleReveal(provider.id)} onCopy={() => copyKey(provider.id)} onDelete={() => deleteKey(provider.id)} />)}
            </div>
            <p className="security-caption">Le mode session est temporaire : aucune clé n’est lue depuis ou écrite dans le stockage persistant. Le mode local utilise le localStorage du navigateur, sans chiffrement. Supprimer une clé ici ne la révoque pas chez NVIDIA.</p>
          </section>
        </div>
      </main>
    </div>
  )
}

type ProviderCardProps = {
  provider: Provider
  value: string
  isActive: boolean
  isOperational: boolean
  isOpen: boolean
  draftKey: string
  keyEditorError: string | null
  storageMode: CredentialStorageMode
  revealed: boolean
  copied: boolean
  copyError: boolean
  onActivate: () => void
  onEdit: () => void
  onDraft: (value: string) => void
  onSave: () => void
  onCancel: () => void
  onReveal: () => void
  onCopy: () => void
  onDelete: () => void
}

function ProviderCard({ provider, value, isActive, isOperational, isOpen, draftKey, keyEditorError, storageMode, revealed, copied, copyError, onActivate, onEdit, onDraft, onSave, onCancel, onReveal, onCopy, onDelete }: ProviderCardProps) {
  if (!isOperational) {
    return (
      <article className="provider-card coming-soon" aria-disabled="true">
        <div className="provider-topline">
          <div className={`provider-logo ${provider.accent}`}>{provider.shortName}</div>
          <div className="provider-title"><div><h3>{provider.name}</h3><span className="coming-soon-badge">Bientôt</span></div><span>{provider.family}</span></div>
          <span className="active-toggle coming-soon-toggle" aria-label="Fournisseur indisponible">À venir</span>
        </div>
        <p className="provider-description">{provider.description}</p>
        <p className="coming-soon-note">Ce fournisseur n’est pas encore connecté. La sélection, la gestion de clé et les tests sont désactivés.</p>
      </article>
    )
  }
  const hasKey = Boolean(value)
  const masked = hasKey ? (revealed ? value : `${value.slice(0, 5)}••••••••${value.slice(-4)}`) : 'Aucune clé connectée'
  return (
    <article className={`provider-card ${isOperational ? 'featured operational' : 'coming-soon'} ${isActive ? 'active' : ''}`}>
      <div className="provider-topline"><div className={`provider-logo ${provider.accent}`}>{provider.shortName}</div><div className="provider-title"><div><h3>{provider.name}</h3><span className={isOperational ? 'recommendation' : 'coming-soon-badge'}>{provider.badge}</span></div><span>{provider.family}</span></div>{isOperational ? <span className="active-toggle selected"><span />Opérationnel</span> : <span className="active-toggle coming-soon-toggle">À venir</span>}</div>
      <p className="provider-description">{provider.description}</p>
      <div className="provider-metrics"><div><strong>Model-level</strong><span>access policy</span></div><div><strong className="endpoint-text">{provider.endpoint}</strong><span>API endpoint</span></div></div>
      <div className={`key-row ${hasKey ? 'connected' : ''}`}>
        <div className="key-status"><span className="key-status-dot" /><div><span className="key-label">API key</span><strong>{masked}</strong></div></div>
        <div className="key-actions">
          {hasKey && <><button type="button" className="plain-icon" onClick={onReveal} aria-label={revealed ? 'Masquer la clé' : 'Révéler la clé'}><Icon name={revealed ? 'eyeOff' : 'eye'} size={16} /></button><button type="button" className="plain-icon" onClick={onCopy} aria-label="Copier la clé"><Icon name="copy" size={16} /></button></>}
          <button type="button" className="edit-key" onClick={onEdit}>{hasKey ? 'Modifier' : 'Connecter'} <Icon name="arrow" size={14} /></button>
          {hasKey && <button type="button" className="plain-icon delete" onClick={onDelete} aria-label="Supprimer la clé"><Icon name="trash" size={15} /></button>}
        </div>
      </div>
      {copied && <div className="copied-toast" role="status">Copié dans le presse-papiers</div>}
      {copyError && <div className="copy-error" role="alert">Copie impossible. Vérifiez les autorisations du navigateur ou utilisez la sélection manuelle.</div>}
      {isOpen && <div className="key-editor"><label htmlFor={`${provider.id}-key`}>Clé API {provider.name}</label><div className="key-input-row"><input id={`${provider.id}-key`} type="password" autoFocus autoComplete="off" spellCheck={false} value={draftKey} onChange={(event) => { onDraft(event.target.value) }} placeholder="Collez votre clé API NVIDIA" aria-invalid={Boolean(keyEditorError)} aria-describedby={keyEditorError ? `${provider.id}-key-error` : undefined} /><button type="button" onClick={onSave}>Enregistrer</button></div>{keyEditorError && <p className="key-editor-error" id={`${provider.id}-key-error`} role="alert">{keyEditorError}</p>}<div className="editor-actions"><span>{'Conservation : '}{storageMode === 'session' ? 'session temporaire' : 'stockage local du navigateur'}</span><button type="button" onClick={onCancel}>Annuler</button></div></div>}
    </article>
  )
}

export default App
