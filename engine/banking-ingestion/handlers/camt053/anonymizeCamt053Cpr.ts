import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { anonymizeCprInText } from '~/lib/text/cpr'

function localName(node: Node | null): string | null {
  return node && node.nodeType === 1 ? (node as Element).localName : null
}

function isCprField(element: Element): boolean {
  const parent = element.parentElement
  const grandparent = parent?.parentElement
  const name = element.localName

  if (name === 'AddtlNtryInf') return localName(parent) === 'Ntry'
  if (name === 'AddtlTxInf') return localName(parent) === 'TxDtls'
  if (name === 'Ustrd' || name === 'AddtlRmtInf') {
    return localName(parent) === 'RmtInf' && localName(grandparent ?? null) === 'TxDtls'
  }
  if (name === 'Prtry') {
    return localName(parent) === 'Purp' && localName(grandparent ?? null) === 'TxDtls'
  }

  return false
}

export function anonymizeCamt053Cpr(xml: string): string {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const elements = document.getElementsByTagName('*')

  for (let index = 0; index < elements.length; index += 1) {
    const element = elements.item(index)
    if (!element || !isCprField(element)) continue

    const text = element.textContent
    if (text) element.textContent = anonymizeCprInText(text)
  }

  return new XMLSerializer().serializeToString(document)
}

export function prepareCamt053XmlForIngestion(xml: string, nodeEnv: string | undefined): string {
  return nodeEnv === 'development' ? anonymizeCamt053Cpr(xml) : xml
}