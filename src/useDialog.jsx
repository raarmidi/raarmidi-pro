// useDialog.jsx
// Kullanım:
//   const { DialogUI, alert, confirm } = useDialog()
//   JSX içinde: <DialogUI />
//   alert("Mesaj")
//   const onay = await confirm("Silmek istediğinize emin misiniz?")

import { useState, useCallback, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, Trash2 } from 'lucide-react'

// ─── Tek seferlik promise'i çözen ref tabanlı resolver ───────────────────────
export function useDialog() {
  const [dialog, setDialog] = useState(null) // { type, title, message, resolve }
  const resolverRef = useRef(null)

  // ── alert ──────────────────────────────────────────────────────────────────
  const showAlert = useCallback((message, { title = 'Bilgi', type = 'info' } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({ kind: 'alert', type, title, message })
    })
  }, [])

  // ── confirm ─────────────────────────────────────────────────────────────────
  const showConfirm = useCallback((message, { title = 'Emin misiniz?', type = 'warn', confirmLabel = 'Evet', cancelLabel = 'İptal' } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({ kind: 'confirm', type, title, message, confirmLabel, cancelLabel })
    })
  }, [])

  const close = (result) => {
    resolverRef.current?.(result)
    setDialog(null)
  }

  // ── Renk / ikon haritası ────────────────────────────────────────────────────
  const THEME = {
    info:    { icon: <Info size={20} />,          ring: 'bg-indigo-100 text-indigo-600',  btn: 'bg-indigo-600 hover:bg-indigo-700' },
    success: { icon: <CheckCircle2 size={20} />,  ring: 'bg-emerald-100 text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    warn:    { icon: <AlertTriangle size={20} />, ring: 'bg-amber-100 text-amber-600',    btn: 'bg-amber-500 hover:bg-amber-600' },
    danger:  { icon: <Trash2 size={20} />,        ring: 'bg-rose-100 text-rose-600',      btn: 'bg-rose-600 hover:bg-rose-700' },
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const DialogUI = () => {
    if (!dialog) return null
    const t = THEME[dialog.type] || THEME.info

    return (
      <div
        className="fixed inset-0 z-[500] flex items-center justify-center p-4"
        style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => e.target === e.currentTarget && dialog.kind === 'alert' && close(true)}
      >
        <div
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
          style={{ animation: 'dialogPop .18s cubic-bezier(.34,1.56,.64,1) both' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-7 pb-4">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${t.ring}`}>
                {t.icon}
              </div>
              <div>
                <p className="font-black text-sm uppercase tracking-tight text-slate-800">{dialog.title}</p>
              </div>
            </div>
            {dialog.kind === 'alert' && (
              <button onClick={() => close(true)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all ml-2">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Body */}
          <p className="px-7 pb-6 text-sm text-slate-500 font-medium leading-relaxed">
            {dialog.message}
          </p>

          {/* Footer */}
          <div className="px-7 pb-7 flex gap-3">
            {dialog.kind === 'confirm' && (
              <button
                onClick={() => close(false)}
                className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95"
              >
                {dialog.cancelLabel}
              </button>
            )}
            <button
              onClick={() => close(true)}
              className={`flex-1 py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 shadow-lg ${t.btn}`}
            >
              {dialog.kind === 'confirm' ? dialog.confirmLabel : 'Tamam'}
            </button>
          </div>
        </div>

        {/* Keyframe animation */}
        <style>{`
          @keyframes dialogPop {
            from { opacity: 0; transform: scale(.92) translateY(8px); }
            to   { opacity: 1; transform: scale(1)   translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  return { DialogUI, alert: showAlert, confirm: showConfirm }
}