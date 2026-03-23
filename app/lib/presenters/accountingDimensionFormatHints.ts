export function accountingDimensionFormatHint(key: string): string | undefined {
  const normalized = String(key ?? '').trim().toLowerCase()

  if (normalized === 'artskonto') {
    return '8 cifre. Starter med S, 9 eller et tal.'
  }

  if (normalized === 'psp-element') {
    return 'X<bogstav>-<1-10 cifre>-<1-5 cifre> (f.eks. XA-123-45)'
  }

  if (normalized === 'omkostningssted') {
    return '1-10 tegn: bogstaver og/eller tal.'
  }

  return undefined
}
