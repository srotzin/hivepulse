import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'hivepulse.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS aei_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    aei_composite REAL,
    bounty_created_1h INTEGER DEFAULT 0,
    bounty_filled_1h INTEGER DEFAULT 0,
    fill_rate_pct REAL DEFAULT 0,
    avg_bounty_value_usdc REAL DEFAULT 0,
    unfilled_by_category TEXT,
    population_by_species TEXT,
    settlement_volume_24h_usdc REAL DEFAULT 0,
    active_streams INTEGER DEFAULT 0,
    total_agents INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reputation_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    capability_premiums TEXT,
    dispute_trends TEXT,
    jurisdiction_scores TEXT,
    credit_default_rates TEXT
  );

  CREATE TABLE IF NOT EXISTS arbitration_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    most_disputed_terms TEXT,
    winning_evidence_types TEXT,
    jurisdiction_bias TEXT,
    avg_resolution_time_ms REAL,
    avg_cost_usdc REAL
  );

  CREATE TABLE IF NOT EXISTS knowledge_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    by_category TEXT,
    trending TEXT,
    citation_leaders TEXT
  );

  CREATE TABLE IF NOT EXISTS genetic_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    top_species TEXT,
    trait_premiums TEXT,
    genetic_drift TEXT,
    offspring_survival_rate REAL
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id TEXT PRIMARY KEY,
    did TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'free',
    price_usdc_month REAL DEFAULT 0,
    features TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT,
    active_until TEXT,
    last_payment_at TEXT
  );

  CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did TEXT NOT NULL,
    query TEXT,
    data_points INTEGER,
    cost_usdc REAL,
    queried_at TEXT
  );

  CREATE TABLE IF NOT EXISTS event_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    event_data TEXT,
    source_service TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS pulse_stats (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_data_points_served INTEGER DEFAULT 0,
    total_revenue_usdc REAL DEFAULT 0,
    last_updated TEXT
  );

  INSERT OR IGNORE INTO pulse_stats (id, total_data_points_served, total_revenue_usdc, last_updated)
  VALUES (1, 0, 0, datetime('now'));
`);

export default db;
