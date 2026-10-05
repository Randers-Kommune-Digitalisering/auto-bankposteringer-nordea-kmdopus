import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { anonymizeCprInText } from '~/lib/text/cpr'

type XmlDocument = ReturnType<DOMParser['parseFromString']>
type XmlNode = NonNullable<ReturnType<XmlDocument['childNodes']['item']>>
type XmlElement = NonNullable<ReturnType<ReturnType<XmlDocument['getElementsByTagName']>['item']>>

function localName(node: XmlNode | null): string | null {
  return node && node.nodeType === 1 ? (node as XmlElement).localName : null
}

function isCprField(element: XmlElement): boolean {
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