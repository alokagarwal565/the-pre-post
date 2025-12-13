-- Initial database schema for The Pre-Post
-- PostgreSQL schema optimized for Neon serverless

-- Users table - simple authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Ideas table - raw input from Idea Box (no formatting, no AI)
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- Raw input as-is
  source TEXT, -- 'text', 'voice', 'paste'
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Refined ideas - AI thinking layer output
CREATE TABLE IF NOT EXISTS refined_ideas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clarified_idea TEXT NOT NULL,
  questions JSONB NOT NULL, -- Array of thinking questions
  angles JSONB NOT NULL, -- ['opinion', 'story', 'teaching', 'contrarian']
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Mind maps - structured thinking tree (JSON)
CREATE TABLE IF NOT EXISTS mind_maps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  refined_idea_id TEXT NOT NULL REFERENCES refined_ideas(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tree JSONB NOT NULL, -- JSON tree structure
  selected_angle TEXT, -- Which angle from refined idea
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Content history - memory engine
CREATE TABLE IF NOT EXISTS content_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea TEXT NOT NULL,
  angle TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'linkedin', 'x', 'blog'
  posted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  themes JSONB -- Extracted themes for repetition detection
);

-- Content plans - decision support
CREATE TABLE IF NOT EXISTS content_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  mind_map_id TEXT NOT NULL REFERENCES mind_maps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'linkedin', 'x', 'blog'
  posting_frequency TEXT, -- 'daily', 'weekly', 'custom'
  suggested_format TEXT, -- AI suggestion
  suggested_day TEXT, -- Best posting day
  suggested_hook TEXT, -- Hook style suggestion
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Drafts - final caption drafts
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  content_plan_id TEXT NOT NULL REFERENCES content_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
  edited BOOLEAN DEFAULT false, -- Whether user edited it
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_refined_ideas_idea_id ON refined_ideas(idea_id);
CREATE INDEX IF NOT EXISTS idx_refined_ideas_user_id ON refined_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_refined_idea_id ON mind_maps(refined_idea_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_user_id ON mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_content_history_user_id ON content_history(user_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_mind_map_id ON content_plans(mind_map_id);
CREATE INDEX IF NOT EXISTS idx_content_plans_user_id ON content_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_content_plan_id ON drafts(content_plan_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);

