import { Button } from './Button'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onCancel,
  pending = false,
}: {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  pending?: boolean
}) {
  return (
    <div
      className="animate-overlay-in scrim fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="animate-dialog-in glass w-full max-w-xs rounded-[var(--radius-card)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="headline text-[24px]">{title}</p>
        {message && <p className="mt-2 text-[14px] text-ink-secondary">{message}</p>}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button size="md" className="flex-1" onClick={onConfirm} disabled={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
