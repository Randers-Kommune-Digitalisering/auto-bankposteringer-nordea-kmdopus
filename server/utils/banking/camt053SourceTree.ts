import { XMLParser } from 'fast-xml-parser'
import type { Camt053SourceTreeNode } from '~/types/transactions'

type OrderedXmlNode = Record<string, unknown>

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '#text',
  cdataPropName: '#cdata',
  commentPropName: '#comment',
  removeNSPrefix: false,
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
})

function asNode(value: unknown): OrderedXmlNode | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as OrderedXmlNode
    : null
}

function elementName(node: OrderedXmlNode): string | null {
  return Object.keys(node).find((key) => key !== ':@' && !key.startsWith('#')) ?? null
}

function localName(name: string): string {
  const separator = name.lastIndexOf(':')
  return separator === -1 ? name : name.slice(separator + 1)
}

function elementChildren(node: OrderedXmlNode): OrderedXmlNode[] {
  const name = elementName(node)
  const children = name ? node[name] : null
  return Array.isArray(children)
    ? children.map(asNode).filter((child): child is OrderedXmlNode => child !== null)
    : []
}

function directElements(node: OrderedXmlNode, expectedName: string): OrderedXmlNode[] {
  return elementChildren(node).filter((child) => {
    const name = elementName(child)
    return name !== null && localName(name) === expectedName
  })
}

function textContent(nodes: OrderedXmlNode[]): string {
  return nodes.map((node) => {
    const text = node['#text']
    if (typeof text === 'string') return text
    const cdata = node['#cdata']
    if (typeof cdata === 'string') return cdata
    const name = elementName(node)
    return name ? textContent(elementChildren(node)) : ''
  }).join('')
}

function findElements(nodes: OrderedXmlNode[], expectedName: string): OrderedXmlNode[] {
  const matches: OrderedXmlNode[] = []

  for (const node of nodes) {
    const name = elementName(node)
    if (name && localName(name) === expectedName) matches.push(node)
    matches.push(...findElements(elementChildren(node), expectedName))
  }

  return matches
}

function collectTransactionDetails(entry: OrderedXmlNode): OrderedXmlNode[] {
  return findElements(elementChildren(entry), 'TxDtls')
}

function findElementPath(nodes: OrderedXmlNode[], target: OrderedXmlNode): OrderedXmlNode[] | null {
  for (const node of nodes) {
    if (node === target) return [node]
    if (!elementName(node)) continue

    const childPath = findElementPath(elementChildren(node), target)
    if (childPath) return [node, ...childPath]
  }

  return null
}

function nodeValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const node = asNode(entry)
      return node ? textContent([node]) : ''
    }).join('')
  }
  return ''
}

function toTreeNode(
  source: OrderedXmlNode,
  id: string,
  selectedTxDetails: OrderedXmlNode | null,
  contextPath: Map<OrderedXmlNode, OrderedXmlNode>,
  statement: OrderedXmlNode,
  entry: OrderedXmlNode,
): Camt053SourceTreeNode[] {
  const name = elementName(source)
  if (!name) {
    for (const [nodeName, kind] of [
      ['#text', 'text'],
      ['#cdata', 'cdata'],
      ['#comment', 'comment'],
    ] as const) {
      if (nodeName in source) {
        const value = nodeValue(source[nodeName])
        if (kind === 'text' && !value.trim()) return []
        return [{ id, kind, name: nodeName, value }]
      }
    }
    return []
  }

  if (localName(name) === 'TxDtls' && selectedTxDetails && source !== selectedTxDetails) {
    return []
  }

  const attributeNode = asNode(source[':@'])
  const attributes = attributeNode
    ? Object.entries(attributeNode).map(([attributeName, value]) => ({
        name: attributeName,
        value: String(value),
      }))
    : []

  const pathChild = contextPath.get(source)
  const children = elementChildren(source).flatMap((child, index) => {
    if (source !== entry && pathChild) {
      const childName = elementName(child)
      const isStatementId = source === statement && childName !== null && localName(childName) === 'Id'
      if (child !== pathChild && !isStatementId) return []
    }

    return toTreeNode(child, `${id}/${index}`, selectedTxDetails, contextPath, statement, entry)
  })

  return [{ id, kind: 'element', name, attributes, children }]
}

export function buildCamt053SourceTree(input: {
  xml: string
  statementId: string
  entryIndex: number | null
  entrySubIndex: number | null
}): Camt053SourceTreeNode | null {
  if (!Number.isInteger(input.entryIndex) || (input.entryIndex ?? 0) < 1) return null

  let parsed: unknown
  try {
    parsed = parser.parse(input.xml)
  } catch {
    return null
  }

  const documentNodes = Array.isArray(parsed)
    ? parsed.map(asNode).filter((node): node is OrderedXmlNode => node !== null)
    : []
  const statements = findElements(documentNodes, 'Stmt')
  const matchingStatements = statements.filter((candidate) =>
    textContent(directElements(candidate, 'Id')).trim() === input.statementId,
  )
  if (matchingStatements.length !== 1) return null
  const statement = matchingStatements[0]!

  const entry = directElements(statement, 'Ntry')[input.entryIndex! - 1]
  if (!entry) return null

  const txDetails = collectTransactionDetails(entry)
  let selectedTxDetails: OrderedXmlNode | null = null
  if (txDetails.length) {
    if (!Number.isInteger(input.entrySubIndex) || (input.entrySubIndex ?? 0) < 1) return null
    selectedTxDetails = txDetails[input.entrySubIndex! - 1] ?? null
    if (!selectedTxDetails) return null
  }

  const document = findElements(documentNodes, 'Document')[0]
  const path = document ? findElementPath([document], entry) : null
  if (!document || !path) return null

  const contextPath = new Map<OrderedXmlNode, OrderedXmlNode>()
  for (let index = 0; index < path.length - 1; index += 1) {
    contextPath.set(path[index]!, path[index + 1]!)
  }

  return toTreeNode(document, 'document', selectedTxDetails, contextPath, statement, entry)[0] ?? null
}