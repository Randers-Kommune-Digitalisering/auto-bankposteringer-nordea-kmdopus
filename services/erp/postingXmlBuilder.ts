import crypto from "node:crypto";
import { Builder } from "xml2js";
import { erpIntegrationMetadata, type ErpIntegrationMetadata } from "../../app/lib/env";

const builder = new Builder({
  xmldec: { version: "1.0", encoding: "UTF-8" },
  renderOpts: { pretty: true },
});

export interface PostingAttachment {
  name: string;
  type: string;
  data: string;
}

export interface PostingLineInput {
  amount: number | string;
  debetOrCredit: "Debet" | "Kredit";
  account: string;
  accountSecondary?: string;
  accountTertiary?: string;
  text?: string;
  cpr?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentData?: string;
  attachments?: PostingAttachment[];
}

export interface BuildPostingXmlOptions {
  bookingDate: Date | string;
  runUid?: string;
  documentId?: string;
  documentDate?: Date;
  metadataOverride?: Partial<ErpIntegrationMetadata>;
  isProduction?: boolean;
  nonProductionMunicipalityCode?: string;
  nonProductionEnvironmentCode?: string;
}

export interface PostingXmlResult {
  filename: string;
  payload: string;
  lineCount: number;
  debitSumInOre: number;
  creditSumInOre: number;
}

export function buildErpPostingXml(
  postings: PostingLineInput[],
  options: BuildPostingXmlOptions,
): PostingXmlResult {
  if (!postings.length) {
    throw new Error("Der skal være mindst én postering for at generere XML");
  }

  const metadata = { ...erpIntegrationMetadata, ...options.metadataOverride };
  const documentDate = options.documentDate ?? new Date();
  const docDate = formatDate(documentDate);
  const docTime = formatTime(documentDate);
  const bookingDate = formatDate(options.bookingDate);
  const isProduction = options.isProduction ?? true;
  const municipalityCode = isProduction
    ? metadata.municipalityCode
    : options.nonProductionMunicipalityCode ?? "797";
  const environmentCode = isProduction
    ? metadata.prodEnvironment
    : options.nonProductionEnvironmentCode ?? "T02";

  let lineCounter = 0;
  let debitSum = 0;
  let creditSum = 0;
  const lines: Record<string, string>[] = [];
  const files: PostingAttachment[] = [];

  for (const posting of postings) {
    lineCounter++;
    const amount = normalizeAmount(posting.amount);
    const amountPrefixed = posting.debetOrCredit === "Debet" ? amount : amount * -1;
    const amountInOre = Math.round(amount * 100);

    if (posting.debetOrCredit === "Debet") {
      debitSum += amountInOre;
    } else if (posting.debetOrCredit === "Kredit") {
      creditSum += amountInOre;
    }

    let secondaryAccount = posting.accountSecondary;
    let glAccount = String(posting.account);

    if (!isProduction) {
      secondaryAccount = posting.accountSecondary ? "XG-9999999990-00001" : undefined;
      glAccount = glAccount.startsWith("9") ? "90515060" : "29505050";
    }

    const line: Record<string, string> = {
      DEB_CRED_IND: posting.debetOrCredit.charAt(0),
      AMT_DOCCUR: amountPrefixed.toFixed(2),
      VALUE_DATE: bookingDate,
      ITEM_TEXT: truncateText(posting.text ?? ""),
      GL_ACCOUNT: glAccount,
      REF_KEY_3: String(lineCounter),
      ZZCSYSIDN: metadata.integrationId,
    };

    if (posting.accountTertiary) line.COSTCENTER = posting.accountTertiary;
    if (secondaryAccount) line.WBS_ELEMENT = secondaryAccount;

    if (posting.cpr) {
      line.SERV_REC_NO_CODE = "02";
      line.SERV_REC_NO = posting.cpr;
      line.BENEFIT_VALFROM = bookingDate;
      line.BENEFIT_VALTO = bookingDate;
    }

    lines.push(line);

    const attachments = normalizeAttachments(posting);
    if (attachments.length) {
      files.push(...attachments);
    }
  }

  const header: Record<string, unknown> = {
    NO_DOC_POSITION: String(lineCounter),
    BALANCE_DEBET: (debitSum / 100).toFixed(2),
    BALANCE_CREDIT: `-${(creditSum / 100).toFixed(2)}`,
    MUNICIPALITY: municipalityCode,
    COMP_CODE: metadata.compCode,
    DOC_DATE: docDate,
    PSTNG_DATE: bookingDate,
    RECEIV_DOC: deriveDocId(options.documentId, options.runUid, metadata.integrationId),
    HEADER_TXT: metadata.integrationId,
    XREF1_HD: metadata.integrationId,
  };

  if (files.length) {
    header.FILES = files.map((file) => ({
      FILE_NAME: file.name,
      FILE_TYPE: file.type,
      FILE: file.data,
    }));
  }

  const xmlObject = {
    "n1:FinancePostingRequest": {
      $: { "xmlns:n1": "http://kmd.dk/fir/posting/external" },
      CONTROL_FIELDS: {
        SENDERID: `${environmentCode}CLNT${municipalityCode}`,
        RECEIVER: `${environmentCode}CLNT${municipalityCode}`,
        FILE_NAME: buildFileName(metadata.integrationFileNameMask, metadata.integrationId, municipalityCode, docDate, docTime),
        SEND_DATE: docDate,
        SEND_TIME: docTime,
      },
      POSTING_DOCUMENT: {
        HEADER: header,
        LINES: { LINE: lines },
      },
    },
  };

  return {
    filename: xmlObject["n1:FinancePostingRequest"].CONTROL_FIELDS.FILE_NAME,
    payload: builder.buildObject(xmlObject),
    lineCount: lineCounter,
    debitSumInOre: debitSum,
    creditSumInOre: creditSum,
  };
}

function formatDate(input: Date | string): string {
  if (typeof input === "string") {
    const compact = input.replaceAll("-", "");
    if (/^\d{8}$/.test(compact)) {
      return compact;
    }

    const parsed = new Date(input);
    if (!Number.isNaN(parsed.getTime())) {
      input = parsed;
    } else {
      throw new Error(`Kan ikke parse dato: ${input}`);
    }
  }

  const date = input as Date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatTime(input: Date): string {
  const hours = String(input.getHours()).padStart(2, "0");
  const minutes = String(input.getMinutes()).padStart(2, "0");
  const seconds = String(input.getSeconds()).padStart(2, "0");
  return `${hours}${minutes}${seconds}`;
}

function truncateText(text: string): string {
  return text.length > 50 ? text.slice(0, 50) : text;
}

function normalizeAmount(amount: number | string): number {
  if (typeof amount === "number") {
    return amount;
  }

  const normalized = amount.replace(/\./g, "").replace(/,/g, ".").trim();
  const parsed = parseFloat(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error(`Ugyldigt beløb: ${amount}`);
  }

  return parsed;
}

function deriveDocId(documentId?: string, runUid?: string, integrationId?: string): string {
  const source = documentId ?? runUid ?? integrationId;
  if (!source) {
    return crypto.randomUUID().slice(-10);
  }

  return source.slice(-10);
}

function buildFileName(
  mask: string,
  integrationId: string,
  municipalityCode: string,
  docDate: string,
  docTime: string,
): string {
  const sanitizedMask = (mask || "posting").replace(/\.xml$/i, "");
  const tokens = {
    xxx: padWithLength(municipalityCode, 3),
    zzzz: padWithLength(integrationId, 4),
    yyyymmdd: docDate,
    hhmmss: docTime,
  } as const;

  const substituted = sanitizedMask.replace(/xxx|zzzz|yyyymmdd|hhmmss/gi, (match) => {
    const key = match.toLowerCase() as keyof typeof tokens;
    return tokens[key] ?? match;
  });

  return `${substituted}.xml`;
}

function padWithLength(value: string, length: number): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "0".repeat(length);
  }

  if (trimmed.length === length) {
    return trimmed;
  }

  if (trimmed.length > length) {
    return trimmed.slice(-length);
  }

  return trimmed.padStart(length, "0");
}

function normalizeAttachments(posting: PostingLineInput): PostingAttachment[] {
  const normalized: PostingAttachment[] = [];

  if (posting.attachments?.length) {
    for (const attachment of posting.attachments) {
      if (attachment.name && attachment.type && attachment.data) {
        normalized.push(attachment);
      }
    }
  }

  if (posting.attachmentData && posting.attachmentName && posting.attachmentType) {
    normalized.push({
      name: posting.attachmentName,
      type: posting.attachmentType,
      data: posting.attachmentData,
    });
  }

  return normalized;
}
