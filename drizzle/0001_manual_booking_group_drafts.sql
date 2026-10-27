CREATE TABLE "manual_booking_group_draft" (
	"group_key" text PRIMARY KEY NOT NULL,
	"member_signature" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text,
	"cpr_type" "cpr_type" NOT NULL,
	"cpr_number" text,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "manual_booking_group_draft_attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_booking_group_draft_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"amount" numeric NOT NULL,
	"text" text
);
--> statement-breakpoint
CREATE TABLE "manual_booking_group_draft_line_dimension" (
	"line_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "manual_booking_group_draft_line_dimension_line_id_key_pk" PRIMARY KEY("line_id","key")
);
--> statement-breakpoint
ALTER TABLE "manual_booking_group_draft_attachment" ADD CONSTRAINT "manual_booking_group_draft_attachment_group_key_manual_booking_group_draft_group_key_fk" FOREIGN KEY ("group_key") REFERENCES "public"."manual_booking_group_draft"("group_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_booking_group_draft_line" ADD CONSTRAINT "manual_booking_group_draft_line_group_key_manual_booking_group_draft_group_key_fk" FOREIGN KEY ("group_key") REFERENCES "public"."manual_booking_group_draft"("group_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_booking_group_draft_line_dimension" ADD CONSTRAINT "manual_booking_group_draft_line_dimension_line_id_manual_booking_group_draft_line_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."manual_booking_group_draft_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "manual_booking_group_draft_attachment_group_sort_order_idx" ON "manual_booking_group_draft_attachment" USING btree ("group_key","sort_order");--> statement-breakpoint
CREATE INDEX "manual_booking_group_draft_line_group_sort_order_idx" ON "manual_booking_group_draft_line" USING btree ("group_key","sort_order");