CREATE TABLE IF NOT EXISTS "user_company_memberships" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "company_id" text NOT NULL,
  "role" varchar(32) DEFAULT 'user' NOT NULL,
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_company_memberships"
  ADD CONSTRAINT "user_company_memberships_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_company_memberships"
  ADD CONSTRAINT "user_company_memberships_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_company_memberships_user_company_unique"
  ON "user_company_memberships" ("user_id", "company_id");
--> statement-breakpoint
INSERT INTO "user_company_memberships" ("id", "user_id", "company_id", "role", "status")
SELECT
  concat('m-', "id", '-', "company_id"),
  "id",
  "company_id",
  CASE WHEN "role" IN ('admin', 'user') THEN "role" ELSE 'user' END,
  CASE WHEN "status" IN ('active', 'inactive') THEN "status" ELSE 'active' END
FROM "users"
WHERE "company_id" IS NOT NULL
ON CONFLICT ("user_id", "company_id") DO NOTHING;
