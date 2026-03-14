CREATE TABLE IF NOT EXISTS "subscription_packages" (
  "id" text PRIMARY KEY NOT NULL,
  "name" varchar(128) NOT NULL,
  "price" integer NOT NULL DEFAULT 0,
  "max_users" integer NOT NULL DEFAULT 1,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO "subscription_packages" ("id", "name", "price", "max_users", "active")
VALUES
  ('starter', 'Starter', 990, 25, true),
  ('growth', 'Growth', 1990, 75, true),
  ('enterprise', 'Enterprise', 3990, 250, true)
ON CONFLICT ("id") DO NOTHING;
