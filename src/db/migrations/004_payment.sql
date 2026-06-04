-- Track payment method and status on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)  NOT NULL DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50)  NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at        TIMESTAMPTZ;
