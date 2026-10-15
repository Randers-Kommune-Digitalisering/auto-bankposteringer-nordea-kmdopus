import type { BookingStatus } from "~/lib/db/schema/enums";
import type { RunSelectSchema } from "~/lib/db/schema/run";

type IsoDateString = string;
type IsoDateTimeString = string;

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

export type ErpDocumentListItem = {
	documentId: string;
};

export type ErrorListItem = {
	id: string;
	runId: string | null;
	source: 'banking' | 'application' | 'erp' | null;
	errorCode: number | null;
	errorString: string | null;
	createdAt: IsoDateTimeString;
	message?: string | null;
};

export type RunListItem = Omit<RunSelectSchema, "bookingDate"> & {
	bookingDate: IsoDateString;
	transactions: TransactionListItem[];
	errors: ErrorListItem[];
	erpDocuments: ErpDocumentListItem[];
};

export type RunListResponse = RunListItem[];
