import {
  BXD_SECURE_ENVELOPE_NAMESPACE,
  bxdDownloadFileListRequestSchema,
  bxdDownloadFileRequestSchema,
  bxdEnvironmentSchema,
  bxdUploadFileRequestSchema,
  buildBxdDownloadFileApplicationRequestXml,
  buildBxdDownloadFileListApplicationRequestXml,
  buildBxdUploadFileApplicationRequestXml,
  parseBxdApplicationResponseXml,
  type BxdApplicationResponse,
  type BxdDownloadFileListRequest,
  type BxdDownloadFileRequest,
  type BxdEnvironment,
  type BxdSigningMaterial,
  type BxdUploadFileRequest,
  type ParseBxdApplicationResponseOptions,
} from '../bxd/secureEnvelope'
import type { XmlDsigAlgorithms } from '../bxd/xmlDsig'

/**
 * Nordea Corporate Access Secure Envelope (ApplicationRequest/ApplicationResponse)
 *
 * Schema targetNamespace: http://bxd.fi/xmldata/
 * Root elements are in that default namespace.
 */
export const NORDEA_SECURE_ENVELOPE_NAMESPACE = BXD_SECURE_ENVELOPE_NAMESPACE

export type NordeaEnvironment = BxdEnvironment
export const nordeaEnvironmentSchema = bxdEnvironmentSchema

export const nordeaUploadFileRequestSchema = bxdUploadFileRequestSchema
export type NordeaUploadFileRequest = BxdUploadFileRequest

export const nordeaDownloadFileListRequestSchema = bxdDownloadFileListRequestSchema
export type NordeaDownloadFileListRequest = BxdDownloadFileListRequest

export const nordeaDownloadFileRequestSchema = bxdDownloadFileRequestSchema
export type NordeaDownloadFileRequest = BxdDownloadFileRequest

export type NordeaSigningMaterial = BxdSigningMaterial & {
  algorithms?: Partial<XmlDsigAlgorithms>
}

export function buildNordeaUploadFileApplicationRequestXml(
  input: NordeaUploadFileRequest,
  signing: NordeaSigningMaterial,
): string {
  return buildBxdUploadFileApplicationRequestXml(input, signing)
}

export function buildNordeaDownloadFileListApplicationRequestXml(
  input: NordeaDownloadFileListRequest,
  signing: NordeaSigningMaterial,
): string {
  return buildBxdDownloadFileListApplicationRequestXml(input, signing)
}

export function buildNordeaDownloadFileApplicationRequestXml(
  input: NordeaDownloadFileRequest,
  signing: NordeaSigningMaterial,
): string {
  return buildBxdDownloadFileApplicationRequestXml(input, signing)
}

export type NordeaApplicationResponse = BxdApplicationResponse

export type ParseNordeaApplicationResponseOptions = ParseBxdApplicationResponseOptions

export function parseNordeaApplicationResponseXml(
  xml: string,
  options: ParseNordeaApplicationResponseOptions = {},
): NordeaApplicationResponse {
  return parseBxdApplicationResponseXml(xml, options)
}

