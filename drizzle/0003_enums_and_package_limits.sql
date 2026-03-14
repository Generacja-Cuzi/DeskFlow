DO $$ BEGIN
  CREATE TYPE company_plan_enum AS ENUM ('starter', 'growth', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE company_status_enum AS ENUM ('active', 'trial', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('superadmin', 'admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status_enum AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_role_enum AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_status_enum AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE floor_element_type_enum AS ENUM ('desk', 'room', 'wall', 'door');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_status_enum AS ENUM ('available', 'borrowed', 'maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_category_enum AS ENUM ('laptops', 'monitors', 'projectors', 'vehicles', 'accessories');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_type_enum AS ENUM ('desk', 'room', 'equipment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status_enum AS ENUM ('pending', 'approved', 'issued', 'active', 'upcoming', 'completed', 'cancelled', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

UPDATE companies SET plan = 'growth' WHERE plan = 'business';
UPDATE resources
SET category = NULL
WHERE category IS NOT NULL
  AND category NOT IN ('laptops', 'monitors', 'projectors', 'vehicles', 'accessories');
UPDATE resources
SET status = 'maintenance'
WHERE status IS NULL
  OR status NOT IN ('available', 'borrowed', 'maintenance');
UPDATE reservations
SET status = 'active'
WHERE status IS NULL
  OR status NOT IN ('pending', 'approved', 'issued', 'active', 'upcoming', 'completed', 'cancelled', 'rejected');

ALTER TABLE companies
  ALTER COLUMN plan DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE users
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE user_company_memberships
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE resources
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE reservations
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE companies
  ALTER COLUMN plan TYPE company_plan_enum USING plan::company_plan_enum,
  ALTER COLUMN status TYPE company_status_enum USING status::company_status_enum;

ALTER TABLE users
  ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum,
  ALTER COLUMN status TYPE user_status_enum USING status::user_status_enum;

ALTER TABLE user_company_memberships
  ALTER COLUMN role TYPE membership_role_enum USING role::membership_role_enum,
  ALTER COLUMN status TYPE membership_status_enum USING status::membership_status_enum;

ALTER TABLE floor_elements
  ALTER COLUMN type TYPE floor_element_type_enum USING type::floor_element_type_enum;

ALTER TABLE resources
  ALTER COLUMN category TYPE resource_category_enum USING category::resource_category_enum,
  ALTER COLUMN status TYPE resource_status_enum USING status::resource_status_enum;

ALTER TABLE reservations
  ALTER COLUMN type TYPE reservation_type_enum USING type::reservation_type_enum,
  ALTER COLUMN status TYPE reservation_status_enum USING status::reservation_status_enum;

ALTER TABLE companies
  ALTER COLUMN plan SET DEFAULT 'starter'::company_plan_enum,
  ALTER COLUMN status SET DEFAULT 'active'::company_status_enum;

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'user'::user_role_enum,
  ALTER COLUMN status SET DEFAULT 'active'::user_status_enum;

ALTER TABLE user_company_memberships
  ALTER COLUMN role SET DEFAULT 'user'::membership_role_enum,
  ALTER COLUMN status SET DEFAULT 'active'::membership_status_enum;

ALTER TABLE resources
  ALTER COLUMN status SET DEFAULT 'available'::resource_status_enum;

ALTER TABLE reservations
  ALTER COLUMN status SET DEFAULT 'active'::reservation_status_enum;

ALTER TABLE subscription_packages
  ADD COLUMN IF NOT EXISTS max_resources integer NOT NULL DEFAULT 100;

UPDATE subscription_packages SET max_resources = 100 WHERE id = 'starter';
UPDATE subscription_packages SET max_resources = 300 WHERE id = 'growth';
UPDATE subscription_packages SET max_resources = 1000 WHERE id = 'enterprise';
