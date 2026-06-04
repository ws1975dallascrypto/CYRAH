-- Laundry services offered
CREATE TABLE IF NOT EXISTS services (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)   NOT NULL,
  description TEXT,
  base_price  NUMERIC(10, 2) NOT NULL,
  active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Available pickup / delivery types
CREATE TABLE IF NOT EXISTS pickup_delivery_types (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(50)    UNIQUE NOT NULL,
  label           VARCHAR(100)   NOT NULL,
  description     TEXT,
  price_surcharge NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Customer orders
CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  service_id     INTEGER        NOT NULL REFERENCES services(id),
  pickup_type_id INTEGER        NOT NULL REFERENCES pickup_delivery_types(id),
  -- scheduled_at is required when pickup type code is 'scheduled'
  scheduled_at   TIMESTAMPTZ,
  notes          TEXT,
  status         VARCHAR(50)    NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
