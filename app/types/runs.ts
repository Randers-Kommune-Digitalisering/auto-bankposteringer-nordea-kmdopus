import type {
	BookingStatus,
	DocumentSelectSchema,
	ErrorSelectSchema,
	RunSelectSchema,
	TransactionSelectSchema,
} from "~/lib/db/schema";

type IsoDateString = string;

export type TransactionListItem = Omit<TransactionSelectSchema, "bookingDate"> & {
	bookingDate: IsoDateString;
	bankAccountLabel?: string | null;
	counterpart?: string | null;
	transactionType?: string | null;
	references?: string[];
	status?: BookingStatus | null;
	ruleApplied?: number | null;
};

export type DocumentListItem = DocumentSelectSchema & {
	mimeType?: string | null;
};

export type ErrorListItem = ErrorSelectSchema & {
	message?: string | null;
};

export type RunListItem = Omit<RunSelectSchema, "bookingDate"> & {
	bookingDate: IsoDateString;
	transactions: TransactionListItem[];
	documents: DocumentListItem[];
	errors: ErrorListItem[];
};

export type RunListResponse = RunListItem[];
