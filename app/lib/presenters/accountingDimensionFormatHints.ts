export function accountingDimensionFormatHint(key: string): string | undefined {
  const normalized = String(key ?? '').trim().toLowerCase()

  if (normalized === 'statuskonto') {
    return '8 cifre (f.eks. 40000000) eller S efterfulgt af 7 cifre.'
  }

  if (normalized === 'psp-element') {
    return 'X<bogstav>-<1-10 cifre>-<1-5 cifre> (f.eks. XA-123-45)'
  }

  if (normalized === 'omkostningssted') {
    return '1-10 tegn: bogstaver og/eller tal.'
  }

  return undefined
}
