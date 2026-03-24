ALTER TABLE company_notification_settings
  ADD COLUMN IF NOT EXISTS in_app_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_app_reservation_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_app_request_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_reservation_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_request_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS in_app_daily_summary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_daily_summary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_user_preferences boolean NOT NULL DEFAULT false;

ALTER TABLE user_notification_preferences
  ADD COLUMN IF NOT EXISTS in_app_daily_summary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_daily_summary boolean NOT NULL DEFAULT false;
