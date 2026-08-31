export function formatPersonName(value: string): string {
  return value
    .replace(/[^\p{L}\s'-]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/(^|\s|['-])(\p{L})/gu, (_, prefix: string, letter: string) => prefix + letter.toUpperCase())
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value)
  return digits.length === 10 || digits.length === 11
}

export function formatEmailInput(value: string): string {
  return value.replace(/\s/g, '').toLowerCase()
}

export function isValidEmail(value: string): boolean {
  const email = formatEmailInput(value)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
