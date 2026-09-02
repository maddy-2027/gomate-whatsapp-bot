-- ============================================================
-- GoMate WhatsApp Bot - Supabase Database Schema v1.0
-- Run ALL of this in Supabase SQL Editor
-- ============================================================

-- USERS table
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  phone           TEXT UNIQUE NOT NULL,
  name            TEXT,
  role            TEXT DEFAULT 'customer' CHECK (role IN ('customer','owner','admin')),
  language        TEXT DEFAULT 'mr',
  last_active_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- OWNERS table
CREATE TABLE IF NOT EXISTS owners (
  id                          BIGSERIAL PRIMARY KEY,
  phone                       TEXT UNIQUE NOT NULL,
  name                        TEXT NOT NULL,
  district                    TEXT DEFAULT 'Sangli',
  village                     TEXT DEFAULT 'Jath',
  subscription_status         TEXT DEFAULT 'trial',
  subscription_expires_at     TIMESTAMPTZ,
  razorpay_subscription_id    TEXT,
  language                    TEXT DEFAULT 'mr',
  created_at                  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_owners_phone ON owners(phone);

-- EQUIPMENT table
CREATE TABLE IF NOT EXISTS equipment (
  id              BIGSERIAL PRIMARY KEY,
  owner_phone     TEXT,
  owner_name      TEXT,
  category        TEXT NOT NULL DEFAULT 'agriculture',
  type            TEXT NOT NULL,
  model           TEXT NOT NULL,
  district        TEXT DEFAULT 'Sangli',
  taluka          TEXT DEFAULT 'Jath',
  village         TEXT DEFAULT 'Jath',
  price_per_day   NUMERIC(10,2) DEFAULT 1500,
  hourly_rate     NUMERIC(10,2) DEFAULT 600,
  service_rates   JSONB,
  available       BOOLEAN DEFAULT TRUE,
  rating          NUMERIC(3,1) DEFAULT 5.0,
  description     TEXT,
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_equipment_category  ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_taluka    ON equipment(taluka);
CREATE INDEX IF NOT EXISTS idx_equipment_available ON equipment(available);

-- BOOKINGS table
CREATE TABLE IF NOT EXISTS bookings (
  id               BIGSERIAL PRIMARY KEY,
  ref              TEXT UNIQUE NOT NULL,
  customer_phone   TEXT NOT NULL,
  customer_name    TEXT,
  customer_village TEXT,
  equipment_id     TEXT,
  equipment_name   TEXT,
  owner_phone      TEXT,
  owner_name       TEXT,
  category         TEXT,
  start_date       DATE,
  duration_days    INTEGER DEFAULT 1,
  total_amount     NUMERIC(10,2),
  platform_fee     NUMERIC(10,2),
  gst_amount       NUMERIC(10,2),
  status           TEXT DEFAULT 'confirmed',
  attachment_service TEXT,
  payment_status   TEXT DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_ref           ON bookings(ref);
CREATE INDEX IF NOT EXISTS idx_bookings_customer      ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_owner         ON bookings(owner_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status);

-- EXPENSE_LOGS table
CREATE TABLE IF NOT EXISTS expense_logs (
  id                TEXT PRIMARY KEY,
  owner_phone       TEXT NOT NULL,
  equipment_name    TEXT,
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_worked      NUMERIC(5,1) DEFAULT 0,
  diesel_litres     NUMERIC(8,2) DEFAULT 0,
  diesel_cost       NUMERIC(10,2) DEFAULT 0,
  maintenance_cost  NUMERIC(10,2) DEFAULT 0,
  operator_wages    NUMERIC(10,2) DEFAULT 0,
  gross_earnings    NUMERIC(10,2) DEFAULT 0,
  net_profit        NUMERIC(10,2) DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expense_owner ON expense_logs(owner_phone);
CREATE INDEX IF NOT EXISTS idx_expense_date  ON expense_logs(date);

-- REVIEWS table
CREATE TABLE IF NOT EXISTS reviews (
  id              TEXT PRIMARY KEY,
  booking_ref     TEXT,
  owner_phone     TEXT NOT NULL,
  customer_phone  TEXT,
  customer_name   TEXT,
  village         TEXT,
  equipment_name  TEXT,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_owner ON reviews(owner_phone);

-- SOS_INCIDENTS table
CREATE TABLE IF NOT EXISTS sos_incidents (
  id                      TEXT PRIMARY KEY,
  farmer_phone            TEXT NOT NULL,
  original_booking_ref    TEXT,
  broken_machine          TEXT,
  replacement_machine     TEXT,
  replacement_owner_phone TEXT,
  cluster                 TEXT,
  status                  TEXT DEFAULT 'active',
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Allow all (service_role key is used server-side)
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners          ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_incidents   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users'        AND policyname='svc_all_users')        THEN CREATE POLICY svc_all_users        ON users        FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='owners'       AND policyname='svc_all_owners')       THEN CREATE POLICY svc_all_owners       ON owners       FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='equipment'    AND policyname='svc_all_equipment')    THEN CREATE POLICY svc_all_equipment    ON equipment    FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookings'     AND policyname='svc_all_bookings')     THEN CREATE POLICY svc_all_bookings     ON bookings     FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='expense_logs' AND policyname='svc_all_expenses')     THEN CREATE POLICY svc_all_expenses     ON expense_logs FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reviews'      AND policyname='svc_all_reviews')      THEN CREATE POLICY svc_all_reviews      ON reviews      FOR ALL USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='sos_incidents' AND policyname='svc_all_sos')         THEN CREATE POLICY svc_all_sos          ON sos_incidents FOR ALL USING (true); END IF;
END $$;
