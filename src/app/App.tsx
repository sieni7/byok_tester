import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
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
    text: 'Bonjour, je suis votre copilote local. Choisissez une clé à gauche, puis lancez votre premier prompt.',
    meta: 'Keydock assistant · maintenant',
  },
  {
    id: 2,
    role: 'assistant',
    text: 'Vos identifiants restent dans ce navigateur. Rien n’est envoyé tant que vous n’avez pas branché votre intégration.',
    meta: 'Sécurité locale activée',
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
  const [activeProvider, setActiveProvider] = useState<ProviderId>('openrouter')
  const [openEditor, setOpenEditor] = useState<ProviderId | null>(null)
  const [draftKey, setDraftKey] = useState('')
  const [revealed, setRevealed] = useState<Set<ProviderId>>(new Set())
  const [copied, setCopied] = useState<ProviderId | null>(null)
  const [copyError, setCopyError] = useState<ProviderId | null>(null)
  const [storageFeedback, setStorageFeedback] = useState<'saved' | 'error' | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draftMessage, setDraftMessage] = useState('')
  const [attachedFile, setAttachedFile] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const configuredCount = useMemo(() => providers.filter((provider) => Boolean(keys[provider.id])).length, [keys])

  useEffect(() => {
    if (storageMode === 'session') {
      setStorageFeedback(null)
      return
    }
    setStorageFeedback(saveCredentials(keys, 'local') ? 'saved' : 'error')
  }, [keys, storageMode])

  const fallbackProvider = providers.slice(0, 1)[0]!
  const configuredProvider = providers.find((provider) => provider.id === activeProvider) ?? fallbackProvider
  const beginAdd = () => beginEdit(providers.find((provider) => !keys[provider.id])?.id ?? fallbackProvider.id)

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
    setRevealed(new Set())
  }

  const beginEdit = (provider: ProviderId) => {
    setOpenEditor(provider)
    setDraftKey(keys[provider])
  }

  const saveKey = () => {
    if (!openEditor) return
    setKeys((current) => ({ ...current, [openEditor]: draftKey.trim() }))
    setOpenEditor(null)
    setDraftKey('')
  }

  const deleteKey = (provider: ProviderId) => {
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

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setAttachedFile(file.name)
  }

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    if (isSending) return
    const text = draftMessage.trim()
    if (!text && !attachedFile) return
    if (activeProvider === 'nvidia' && !keys.nvidia) {
      setSendError('Ajoutez une clé NVIDIA NIM dans le gestionnaire de clés avant l’envoi.')
      return
    }
    if (activeProvider === 'nvidia' && attachedFile) {
      setSendError('Les pièces jointes ne sont pas prises en charge par cette première intégration NVIDIA. Retirez le fichier pour continuer.')
      return
    }

    const submittedText = text || `Fichier joint : ${attachedFile}`
    setSendError(null)
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: submittedText }])
    setDraftMessage('')
    setAttachedFile(null)

    if (activeProvider === 'nvidia') {
      setIsSending(true)
      try {
        const model = nvidiaModels[0]!
        const response = await sendNvidiaChatCompletion({
          apiKey: keys.nvidia,
          prompt: text,
          model: model.id,
        })
        setMessages((current) => [...current, {
          id: Date.now() + 1,
          role: 'assistant',
          text: response,
          meta: `NVIDIA NIM · ${model.label}`,
        }])
      } catch (error) {
        setSendError(error instanceof Error ? error.message : 'Une erreur inattendue est survenue pendant l’appel NVIDIA.')
      } finally {
        setIsSending(false)
      }
      return
    }

    window.setTimeout(() => {
      const provider = providers.find((item) => item.id === activeProvider) ?? fallbackProvider
      const response = keys[activeProvider]
        ? `Prompt préparé pour ${provider?.name}. Le branchement réseau reste volontairement désactivé dans ce prototype local.`
        : `Votre message est prêt. Ajoutez une clé ${provider?.name} à droite pour activer ce fournisseur.`
      setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: response, meta: `${provider?.shortName} · mode local` }])
    }, 450)
  }

  return (
    <div className="app-shell" data-theme={theme}>
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
          <a className="nav-item active" href="#dashboard"><Icon name="grid" /><span>Dashboard</span><span className="nav-count">01</span></a>
          <a className="nav-item" href="#providers"><Icon name="key" /><span>API keys</span><span className="nav-count live">{configuredCount}</span></a>
          <a className="nav-item" href="#docs"><Icon name="book" /><span>Docs & guides</span><Icon name="external" size={14} /></a>
          <p className="nav-label nav-label-spaced">System</p>
          <a className="nav-item" href="#settings"><Icon name="settings" /><span>Settings</span></a>
        </nav>

        <div className="sidebar-bottom">
          <div className="vault-note">
            <div className="vault-icon"><Icon name="shield" size={17} /></div>
            <div><strong>Local vault</strong><span>Vos secrets restent ici.</span></div>
          </div>
          <div className="profile-row"><div className="profile-avatar">A</div><div><strong>Alex Morgan</strong><span>Personal workspace</span></div><span className="more-dots">•••</span></div>
        </div>
      </aside>

      <main className="workspace" id="dashboard">
        <header className="topbar">
          <div className="crumbs"><span>Workspace</span><b>/</b><strong>Dashboard</strong></div>
          <div className="topbar-actions">
            <div className="sync-status"><i /> {storageMode === 'session' ? 'session only · volatile' : storageFeedback === 'error' ? 'local save unavailable' : 'local browser storage'}</div>
            <button className="theme-toggle" type="button" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} aria-pressed={theme === 'dark'}>
              {theme === 'dark' ? '☀ Mode clair' : '☾ Mode sombre'}
            </button>
            <button className="icon-button top-settings" aria-label="Paramètres"><Icon name="settings" size={18} /></button>
          </div>
        </header>

        <section className="intro-row">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> YOUR AI CONTROL ROOM</div>
            <h1>One key.<br /><em>Every model.</em></h1>
            <p className="intro-copy">Un espace calme pour brancher, tester et gérer vos fournisseurs IA — sans éparpiller vos secrets.</p>
          </div>
          <div className="intro-stats">
            <div className="stat-block"><strong>{configuredCount}<small>/ {providers.length}</small></strong><span>providers ready</span></div>
            <div className="stat-divider" />
            <div className="stat-block"><strong>{storageMode === 'session' ? 'RAM' : '100%'}</strong><span>{storageMode === 'session' ? 'volatile session' : 'local storage'}</span></div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="chat-card" aria-labelledby="chat-title">
            <div className="chat-card-head">
              <div><div className="section-kicker light"><span className="pulse-dot" /> PLAYGROUND</div><h2 id="chat-title">Try your setup</h2></div>
              <button className="small-control" type="button"><span className="status-dot" /> Session active <Icon name="chevron" size={13} /></button>
            </div>
            <div className="chat-context">
              <div className="mini-model-icon">{configuredProvider?.shortName}</div>
              <div><span>Active provider</span><strong>{configuredProvider?.name}</strong></div>
              <select aria-label="Choisir le fournisseur actif" value={activeProvider} onChange={(event) => { setActiveProvider(event.target.value as ProviderId); setSendError(null) }}>
                {providers.map((provider) => <option value={provider.id} key={provider.id}>{provider.name}{keys[provider.id] ? ' · ready' : ''}</option>)}
              </select>
            </div>
            <div className="messages" aria-live="polite">
              {messages.map((message) => (
                <div className={`message-row ${message.role}`} key={message.id}>
                  {message.role === 'assistant' && <div className="assistant-avatar"><span /><span /><span /></div>}
                  <div className="message-stack"><div className="message-bubble">{message.text}</div>{message.meta && <span className="message-meta">{message.meta}</span>}</div>
                </div>
              ))}
            </div>
            {sendError && <div className="chat-error" role="alert">{sendError}</div>}
            {activeProvider === 'nvidia' && <div className="nvidia-notice">Requête texte directe vers NVIDIA NIM · le message envoyé est transmis à NVIDIA. Pas de pièce jointe ni de streaming dans cette alpha.</div>}
            <form className="composer" onSubmit={handleSend}>
              {attachedFile && <div className="attachment-chip"><Icon name="paperclip" size={14} /> {attachedFile}<button type="button" onClick={() => setAttachedFile(null)} aria-label="Retirer la pièce jointe">×</button></div>}
              <textarea value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} placeholder={activeProvider === 'nvidia' ? 'Envoyer un prompt à NVIDIA NIM…' : 'Ask anything about your setup...'} rows={2} aria-label="Votre message" disabled={isSending} />
              <div className="composer-actions">
                <div className="composer-tools">
                  <label className="tool-button" aria-label="Joindre un fichier"><Icon name="paperclip" size={17} /><input type="file" onChange={handleFile} /></label>
                  <button className={`tool-button ${isListening ? 'listening' : ''}`} type="button" aria-label="Activer le microphone" onClick={() => setIsListening((value) => !value)}><Icon name="mic" size={17} /></button>
                  <span className="tool-hint">{isListening ? 'Listening...' : '⌘ + Enter to run'}</span>
                </div>
                <button className="send-button" type="submit" aria-label="Envoyer" disabled={isSending}>{isSending ? '…' : <Icon name="arrow" size={18} />}</button>
              </div>
            </form>
            <div className="chat-footnote"><Icon name="shield" size={13} /> Messages are not stored outside this session</div>
          </section>

          <section className="keys-area" id="providers" aria-labelledby="keys-title">
            <div className="keys-head"><div><div className="section-kicker">YOUR PROVIDERS</div><h2 id="keys-title">API key manager</h2></div><button className="add-key-button" type="button" onClick={beginAdd}><Icon name="plus" size={16} /> Add key</button></div>
            <div className="keys-summary"><div className="summary-main"><div className="summary-icon"><Icon name="key" size={19} /></div><div><strong>{configuredCount === 0 ? 'No keys yet' : `${configuredCount} provider${configuredCount > 1 ? 's' : ''} configured`}</strong><span>{storageMode === 'session' ? 'Session only · cleared on reload' : 'Stored only in this browser'}</span></div></div><div className="summary-badge"><span /> {storageMode === 'session' ? 'session only' : 'local storage only*'}</div></div>
            <div className="credential-mode-section">
              <div className="storage-mode-heading"><strong>How should Keydock keep your API keys?</strong><span>Choose where credentials are kept. You can change this at any time.</span></div>
              <div className="credential-mode-options" role="group" aria-label="Mode de conservation des identifiants">
                <button type="button" className={`credential-mode-option ${storageMode === 'session' ? 'selected' : ''}`} aria-pressed={storageMode === 'session'} onClick={() => changeStorageMode('session')}>
                  <span className="mode-option-title">Session only <span className="mode-recommended">Recommended</span></span>
                  <span className="mode-option-description">Kept in memory only. Keys are cleared when you reload or close this tab. Nothing is written to browser storage.</span>
                </button>
                <button type="button" className={`credential-mode-option ${storageMode === 'local' ? 'selected' : ''}`} aria-pressed={storageMode === 'local'} onClick={() => changeStorageMode('local')}>
                  <span className="mode-option-title">Local browser storage</span>
                  <span className="mode-option-description">Keeps keys in this browser between visits. This is convenient, but localStorage is not encrypted or a secure vault.</span>
                </button>
              </div>
            </div>
            {storageMode === 'session'
              ? <p className="storage-feedback session" role="status">Session mode active: no credentials are read from or written to persistent browser storage.</p>
              : <p className={`storage-feedback ${storageFeedback === 'error' ? 'error' : 'success'}`} role="status">{storageFeedback === 'error' ? 'Échec de sauvegarde : le navigateur bloque ou ne permet pas le stockage local. Vos clés ne sont pas persistées.' : storageFeedback === 'saved' ? 'Sauvegarde locale confirmée.' : 'Vérification du stockage local…'}</p>}
            <div className="provider-list">
              {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} value={keys[provider.id]} isActive={activeProvider === provider.id} isOpen={openEditor === provider.id} draftKey={draftKey} revealed={revealed.has(provider.id)} copied={copied === provider.id} copyError={copyError === provider.id} onActivate={() => setActiveProvider(provider.id)} onEdit={() => beginEdit(provider.id)} onDraft={setDraftKey} onSave={saveKey} onCancel={() => setOpenEditor(null)} onReveal={() => toggleReveal(provider.id)} onCopy={() => copyKey(provider.id)} onDelete={() => deleteKey(provider.id)} />)}
            </div>
            <p className="security-caption">* Local browser storage is not a secure vault. Session mode is volatile and writes nothing to the credentials store.</p>
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
  isOpen: boolean
  draftKey: string
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

function ProviderCard({ provider, value, isActive, isOpen, draftKey, revealed, copied, copyError, onActivate, onEdit, onDraft, onSave, onCancel, onReveal, onCopy, onDelete }: ProviderCardProps) {
  const hasKey = Boolean(value)
  const masked = hasKey ? (revealed ? value : `${value.slice(0, 5)}••••••••${value.slice(-4)}`) : 'No key connected'
  return (
    <article className={`provider-card ${provider.id === 'openrouter' ? 'featured' : ''} ${isActive ? 'active' : ''}`}>
      <div className="provider-topline"><div className={`provider-logo ${provider.accent}`}>{provider.shortName}</div><div className="provider-title"><div><h3>{provider.name}</h3>{provider.id === 'openrouter' && <span className="recommendation">{provider.badge}</span>}</div><span>{provider.family}</span></div><button className={`active-toggle ${isActive ? 'selected' : ''}`} type="button" onClick={onActivate} aria-label={`Définir ${provider.name} comme fournisseur actif`}><span />{isActive ? 'Active' : 'Set active'}</button></div>
      <p className="provider-description">{provider.description}</p>
      <div className="provider-metrics"><div><strong>Model-level</strong><span>access policy</span></div><div><strong className="endpoint-text">{provider.endpoint}</strong><span>OpenAI-compatible endpoint</span></div></div>
      <div className={`key-row ${hasKey ? 'connected' : ''}`}>
        <div className="key-status"><span className="key-status-dot" /><div><span className="key-label">API key</span><strong>{masked}</strong></div></div>
        <div className="key-actions">
          {hasKey && <><button type="button" className="plain-icon" onClick={onReveal} aria-label={revealed ? 'Masquer la clé' : 'Révéler la clé'}><Icon name={revealed ? 'eyeOff' : 'eye'} size={16} /></button><button type="button" className="plain-icon" onClick={onCopy} aria-label="Copier la clé"><Icon name="copy" size={16} /></button></>}
          <button type="button" className="edit-key" onClick={onEdit}>{hasKey ? 'Edit' : 'Connect'} <Icon name="arrow" size={14} /></button>
          {hasKey && <button type="button" className="plain-icon delete" onClick={onDelete} aria-label="Supprimer la clé"><Icon name="trash" size={15} /></button>}
        </div>
      </div>
      {copied && <div className="copied-toast" role="status">Copié dans le presse-papiers</div>}
      {copyError && <div className="copy-error" role="alert">Copie impossible. Vérifiez les autorisations du navigateur ou utilisez la sélection manuelle.</div>}
      {isOpen && <div className="key-editor"><label htmlFor={`${provider.id}-key`}>Paste your {provider.name} key</label><div className="key-input-row"><input id={`${provider.id}-key`} type="password" autoFocus value={draftKey} onChange={(event) => onDraft(event.target.value)} placeholder="sk-..." /><button type="button" onClick={onSave}>Save</button></div><div className="editor-actions"><span>Stored in current credential mode</span><button type="button" onClick={onCancel}>Cancel</button></div></div>}
    </article>
  )
}

export default App
