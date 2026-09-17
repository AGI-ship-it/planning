import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}): JSX.Element {
  const base =
    'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const styles: Record<string, string> = {
    primary: 'bg-accent text-white hover:bg-[#164ba8]',
    secondary: 'border border-line bg-white text-ink hover:bg-surface',
    ghost: 'text-muted hover:text-ink hover:bg-surface',
    danger: 'border border-line bg-white text-bad hover:bg-[#fef3f2]',
  }
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />
}

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'flag' | 'bad' | 'good' | 'info'
  children: ReactNode
}): JSX.Element {
  const styles: Record<string, string> = {
    neutral: 'bg-surface text-muted border-line',
    flag: 'bg-[#fffaeb] text-flag border-[#fedf89]',
    bad: 'bg-[#fef3f2] text-bad border-[#fecdca]',
    good: 'bg-[#ecfdf3] text-good border-[#abefc6]',
    info: 'bg-[#eff4ff] text-accent border-[#b2ccff]',
  }
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${styles[tone]}`}
    >
      {children}
    </span>
  )
}

export function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title?: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}): JSX.Element {
  return (
    <section className="rounded border border-line bg-white">
      {(title || right) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-2.5">
          <div>
            {title && <h2 className="text-[13px] font-semibold text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}): JSX.Element {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] text-muted">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  )
}

export const inputClass =
  'w-full rounded border border-line bg-white px-2 py-1.5 text-[13px] tnum focus:border-accent'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
}): JSX.Element | null {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        role="presentation"
      />
      <aside
        className="relative z-50 flex h-full w-[620px] flex-col border-l border-line bg-white shadow-xl"
        role="dialog"
        aria-label={title}
      >
        <header className="flex items-start justify-between border-b border-line px-4 py-3">
          <div>
            <h2 className="text-[14px] font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[12px] text-muted">{subtitle}</p>}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }): JSX.Element {
  return <div className="px-4 py-10 text-center text-[12px] text-muted">{children}</div>
}
