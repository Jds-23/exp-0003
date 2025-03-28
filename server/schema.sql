PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS "keypairs";
DROP TABLE IF EXISTS "schedules";
DROP TABLE IF EXISTS "transactions";

CREATE TABLE IF NOT EXISTS "keypairs" (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address TEXT UNIQUE NOT NULL,
    telegram_user_id TEXT NOT NULL,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    role TEXT NOT NULL, -- session or admin
    type TEXT NOT NULL, -- p256
    expiry INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "transactions" (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address TEXT NOT NULL,
    hash TEXT NOT NULL,
    role TEXT NOT NULL, -- session or admin
    public_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "schedules" (
    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    address TEXT NOT NULL,
    schedule TEXT NOT NULL,
    action TEXT NOT NULL,
    calls TEXT NOT NULL
);
