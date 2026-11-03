ALTER TABLE "erp_request" ADD COLUMN "created_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "erp_request" request
SET "created_at" = COALESCE(
  (
    SELECT min(delivery."created_at")
    FROM "outbox" delivery
    WHERE delivery."topic" = 'erp.uploadRequestPayload'
      AND delivery."payload" ->> 'requestId' = request."id"
  ),
  (
    SELECT min(event."created_at")
    FROM "run_timeline_event" event
    WHERE event."stage" = 'erp'
      AND event."request_id" = request."id"
  ),
  now()
);
--> statement-breakpoint
ALTER TABLE "erp_request" ALTER COLUMN "created_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "erp_request" ALTER COLUMN "created_at" SET NOT NULL;
