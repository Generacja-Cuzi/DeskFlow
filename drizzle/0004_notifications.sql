DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM ('reservation', 'equipment', 'reminder', 'approval', 'rejection', 'info');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  company_id text NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL DEFAULT 'info',
  title varchar(255) NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_company_user_created_idx ON notifications(company_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, read);
