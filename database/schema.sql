-- Tự động tạo ở lần đồng bộ đầu tiên; có thể chạy tay trong Neon SQL Editor.
CREATE TABLE IF NOT EXISTS kotoba_progress (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
