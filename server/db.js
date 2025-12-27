const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'score.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();

  // 尝试加载现有数据库
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // 创建表
  db.run(`
    CREATE TABLE IF NOT EXISTS judges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      secret_key TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contestants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      track TEXT NOT NULL DEFAULT 'A',
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      track TEXT NOT NULL DEFAULT 'A',
      max_score INTEGER DEFAULT 10,
      weight REAL DEFAULT 1.0,
      order_num INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judge_id TEXT NOT NULL,
      contestant_id INTEGER NOT NULL,
      dimension_id INTEGER NOT NULL,
      score REAL NOT NULL,
      is_anonymous INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(judge_id, contestant_id, dimension_id)
    )
  `);

  // 检查并添加 track 字段（兼容旧数据库）
  try {
    db.run('SELECT track FROM contestants LIMIT 1');
  } catch (e) {
    db.run('ALTER TABLE contestants ADD COLUMN track TEXT NOT NULL DEFAULT "A"');
  }

  try {
    db.run('SELECT track FROM dimensions LIMIT 1');
  } catch (e) {
    db.run('ALTER TABLE dimensions ADD COLUMN track TEXT NOT NULL DEFAULT "A"');
  }

  // 添加 is_anonymous 字段（兼容旧数据库）
  try {
    db.run('SELECT is_anonymous FROM scores LIMIT 1');
  } catch (e) {
    db.run('ALTER TABLE scores ADD COLUMN is_anonymous INTEGER DEFAULT 0');
  }

  // 大众点评表
  db.run(`
    CREATE TABLE IF NOT EXISTS public_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contestant_id INTEGER NOT NULL,
      voter_id TEXT NOT NULL,
      rating REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(contestant_id, voter_id)
    )
  `);

  // 赛道表
  db.run(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      color TEXT DEFAULT 'blue',
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 初始化默认赛道（如果没有的话）
  const existingTracks = prepare('SELECT COUNT(*) as count FROM tracks').get();
  if (existingTracks.count === 0) {
    db.run("INSERT INTO tracks (name, display_name, color, order_num) VALUES ('A', 'A赛道', 'orange', 1)");
    db.run("INSERT INTO tracks (name, display_name, color, order_num) VALUES ('B', 'B赛道', 'purple', 2)");
  }

  // 评分配置表
  db.run(`
    CREATE TABLE IF NOT EXISTS score_config (
      id INTEGER PRIMARY KEY,
      professional_weight REAL DEFAULT 70,
      public_weight REAL DEFAULT 30,
      default_max_score INTEGER DEFAULT 5,
      show_public_vote_realtime INTEGER DEFAULT 1,
      ai_scoring_enabled INTEGER DEFAULT 0,
      ai_role_prompt TEXT DEFAULT '你是一位专业的演讲评委，请根据演讲者的表达能力、内容质量、逻辑清晰度等方面进行评分。',
      deepseek_api_key TEXT DEFAULT '',
      countdown_minutes INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // AI 评分记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contestant_id INTEGER NOT NULL,
      speech_text TEXT NOT NULL,
      score REAL NOT NULL,
      feedback TEXT,
      dimension_scores TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 添加 show_public_vote_realtime 字段（兼容旧数据库）
  try {
    db.run('SELECT show_public_vote_realtime FROM score_config LIMIT 1');
  } catch (e) {
    db.run('ALTER TABLE score_config ADD COLUMN show_public_vote_realtime INTEGER DEFAULT 1');
  }

  // 添加 AI 评分相关字段（兼容旧数据库）
  try {
    db.run('SELECT ai_scoring_enabled FROM score_config LIMIT 1');
  } catch (e) {
    db.run('ALTER TABLE score_config ADD COLUMN ai_scoring_enabled INTEGER DEFAULT 0');
  }

  try {
    db.run('SELECT ai_role_prompt FROM score_config LIMIT 1');
  } catch (e) {
    db.run("ALTER TABLE score_config ADD COLUMN ai_role_prompt TEXT DEFAULT '你是一位专业的演讲评委，请根据演讲者的表达能力、内容质量、逻辑清晰度等方面进行评分。'");
  }

  try {
    db.run('SELECT deepseek_api_key FROM score_config LIMIT 1');
  } catch (e) {
    db.run("ALTER TABLE score_config ADD COLUMN deepseek_api_key TEXT DEFAULT ''");
  }

  // 添加 countdown_minutes 字段（兼容旧数据库）
  try {
    db.run('SELECT countdown_minutes FROM score_config LIMIT 1');
  } catch (e) {
    db.run('ALTER TABLE score_config ADD COLUMN countdown_minutes INTEGER DEFAULT 0');
  }

  // 初始化默认配置（如果没有的话）
  const existingConfig = prepare('SELECT COUNT(*) as count FROM score_config').get();
  if (existingConfig.count === 0) {
    db.run("INSERT INTO score_config (id, professional_weight, public_weight, default_max_score) VALUES (1, 70, 30, 5)");
  }

  saveDatabase();
  console.log('Database initialized');
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getDb() {
  return db;
}

// Helper functions to match better-sqlite3 API
function prepare(sql) {
  return {
    run: (...params) => {
      db.run(sql, params);
      saveDatabase();
      return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    }
  };
}

function exec(sql) {
  db.run(sql);
  saveDatabase();
}

function transaction(fn) {
  return (...args) => {
    db.run('BEGIN TRANSACTION');
    try {
      fn(...args);
      db.run('COMMIT');
      saveDatabase();
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  };
}

module.exports = {
  initDatabase,
  getDb,
  prepare,
  exec,
  transaction,
  saveDatabase
};
