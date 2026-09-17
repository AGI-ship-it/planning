export const qty = (n: number, dp = 0): string =>
  n.toLocaleString('en-AE', { minimumFractionDigits: dp, maximumFractionDigits: dp })

export const aed = (n: number): string =>
  n.toLocaleString('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })

export const days = (n: number): string => `${Math.round(n)}d`

export const millions = (n: number): string => `${(n / 1_000_000).toFixed(2)}M`

export const stamp = (d: Date): string =>
  d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
