import { XMLValidator } from 'fast-xml-parser'

export function isWellFormedXml(xml: string): boolean {
  return XMLValidator.validate(xml) === true
}