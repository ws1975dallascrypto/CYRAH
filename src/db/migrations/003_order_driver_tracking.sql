-- Track driver matching and priority fee prompt on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_matched_at  TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority_fee_offered  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority_fee_accepted BOOLEAN;
