DO $$
BEGIN
  ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'undtaget';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
