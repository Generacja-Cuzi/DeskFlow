CREATE TABLE IF NOT EXISTS company_notification_settings (
  company_id text PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  email_enabled boolean NOT NULL DEFAULT true,
  reservation_alerts boolean NOT NULL DEFAULT true,
  request_alerts boolean NOT NULL DEFAULT true,
  daily_summary boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE user_notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_app_reservation_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_app_request_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_reservation_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_request_alerts boolean NOT NULL DEFAULT true;
