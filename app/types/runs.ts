import type { ErrorSelectSchema } from "~/lib/db/schema/error";
import type { BookingStatus } from "~/lib/db/schema/enums";
import type { RunSelectSchema } from "~/lib/db/schema/run";

type IsoDateString = string;

export type TransactionListItem = {
	id: string;
	runId: string;
	accountId: string | null;
	amount: string;
	bookingDate: IsoDateString;
	bankAccountLabel?: string | null;
	counterpart?: string | null;
	transactionType?: string | null;
	references?: string[];
	status?: BookingStatus | null;
	ruleApplied?: number | null;
};

export type DocumentListItem = {
	id: string;
	runId: string;
	type: string | null;
	filename: string;
	fileExtension: string;
	content?: string | null;
	mimeType?: string | null;
};

export type DocumentContentItem = {
	id: string;
	filename: string;
	fileExtension: string;
	content: string;
	mimeType?: string | null;
};

export type ErpResponseListItem = {
	id: string;
};

export type ErrorListItem = ErrorSelectSchema & {
	message?: string | null;
};

export type RunListItem = Omit<RunSelectSchema, "bookingDate"> & {
	bookingDate: IsoDateString;
	transactions: TransactionListItem[];
	documents: DocumentListItem[];
	errors: ErrorListItem[];
	erpResponses: ErpResponseListItem[];
};

export type RunListResponse = RunListItem[];
