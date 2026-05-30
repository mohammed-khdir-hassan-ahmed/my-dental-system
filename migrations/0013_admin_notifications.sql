CREATE TABLE IF NOT EXISTS admin_notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(32) NOT NULL DEFAULT 'login',
  user_email TEXT NOT NULL,
  user_id INTEGER,
  login_method VARCHAR(16) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_notifications_read_created_idx
  ON admin_notifications (read, created_at DESC);
