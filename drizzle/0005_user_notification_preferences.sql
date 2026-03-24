CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  reservation_alerts boolean NOT NULL DEFAULT true,
  request_alerts boolean NOT NULL DEFAULT true,
  reminder_alerts boolean NOT NULL DEFAULT true,
  daily_summary boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_notification_preferences_user_company_unique
  ON user_notification_preferences(user_id, company_id);
