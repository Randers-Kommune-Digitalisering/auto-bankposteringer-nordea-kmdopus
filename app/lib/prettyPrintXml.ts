export type PrettyPrintXmlOptions = {
	indent?: string
	newline?: string
}

const DEFAULT_INDENT = '  '
const DEFAULT_NEWLINE = '\n'

function isClosingTag(line: string) {
	return /^<\//.test(line)
}

function isSelfClosingTag(line: string) {
	return /\/>$/.test(line)
}

function isProcessingInstruction(line: string) {
	return /^<\?/.test(line)
}

function isDeclarationOrComment(line: string) {
	return /^<!/.test(line)
}

function isOpenTag(line: string) {
	if (!/^</.test(line)) return false
	if (isClosingTag(line)) return false
	if (isSelfClosingTag(line)) return false
	if (isProcessingInstruction(line)) return false
	if (isDeclarationOrComment(line)) return false
	// One-line element with content: <a>text</a>
	if (/<\/[^>]+>$/.test(line)) return false
	return />$/.test(line)
}

/**
 * Pretty-prints XML by adding newlines + indentation.
 *
 * Note: This is a best-effort formatter intended for UI editing.
 * It avoids runtime dependencies and does not validate XML.
 */
export function prettyPrintXml(input: string, options: PrettyPrintXmlOptions = {}): string {
	const indent = options.indent ?? DEFAULT_INDENT
	const newline = options.newline ?? DEFAULT_NEWLINE

	const trimmed = input.trim()
	if (!trimmed) return input

	// Insert newlines between tags (but keep existing text nodes intact).
	const withBreaks = trimmed.replace(/(>)(\s*)(<)/g, `$1${newline}$3`)
	const rawLines = withBreaks
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)

	let depth = 0
	const formattedLines: string[] = []

	for (const line of rawLines) {
		if (isClosingTag(line)) {
			depth = Math.max(0, depth - 1)
		}

		formattedLines.push(`${indent.repeat(depth)}${line}`)

		if (isOpenTag(line)) {
			depth += 1
		}
	}

	return formattedLines.join(newline)
}
