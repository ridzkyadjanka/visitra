-- VISITRA database schema (PostgreSQL 13+)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'RECEPTIONIST'
                CHECK (role IN ('SUPER_ADMIN','ADMIN','RECEPTIONIST','VIEWER')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pics (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  department TEXT NOT NULL,
  location   TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- visit_code  : unik selamanya, mis. VIS-20261014-0015
-- queue_number: nomor antrean harian yang ditampilkan ke tamu, mis. A-015
CREATE TABLE IF NOT EXISTS visits (
  id           SERIAL PRIMARY KEY,
  visit_code   TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 20),
  queue_number TEXT NOT NULL,
  queue_date   DATE NOT NULL,
  name         TEXT NOT NULL,
  institution  TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  id_number    TEXT,
  purpose      TEXT NOT NULL,
  notes        TEXT,
  photo        TEXT,
  status       TEXT NOT NULL DEFAULT 'REGISTERED'
               CHECK (status IN ('SCHEDULED','REGISTERED','CHECKED_IN','CHECKED_OUT','CANCELLED')),
  approval     TEXT NOT NULL DEFAULT 'APPROVED'
               CHECK (approval IN ('PENDING','APPROVED','REJECTED')),
  scheduled_at TIMESTAMPTZ,
  check_in_at  TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  pic_id       INTEGER REFERENCES pics(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS visits_queue_date_idx ON visits(queue_date);
CREATE INDEX IF NOT EXISTS visits_status_idx ON visits(status);

-- Penghitung nomor antrean per hari (atomik)
CREATE TABLE IF NOT EXISTS daily_counters (
  date  DATE PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  pic_id     INTEGER REFERENCES pics(id) ON DELETE CASCADE,
  visit_id   INTEGER REFERENCES visits(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name  TEXT NOT NULL DEFAULT 'PT Contoh Indonesia',
  address       TEXT NOT NULL DEFAULT 'Jl. Jend. Sudirman No. 10, Jakarta',
  phone         TEXT NOT NULL DEFAULT '(021) 555-0101',
  queue_prefix  TEXT NOT NULL DEFAULT 'A',
  code_prefix   TEXT NOT NULL DEFAULT 'VIS',
  open_time     TEXT NOT NULL DEFAULT '08:00',
  close_time    TEXT NOT NULL DEFAULT '17:00',
  purposes      TEXT NOT NULL DEFAULT 'Meeting,Interview,Pengambilan Dokumen,Pengiriman Barang,Kunjungan Kerja,Keperluan Lain',
  require_photo BOOLEAN NOT NULL DEFAULT FALSE,
  mask_personal BOOLEAN NOT NULL DEFAULT TRUE,
  session_hours INTEGER NOT NULL DEFAULT 8
);
