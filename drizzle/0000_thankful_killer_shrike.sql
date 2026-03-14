CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"plan" varchar(32) DEFAULT 'starter' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_branding" (
	"company_id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo" text,
	"primary_color" varchar(32) DEFAULT '#3b82f6' NOT NULL,
	"secondary_color" varchar(32) DEFAULT '#10b981' NOT NULL,
	"text_color" varchar(32) DEFAULT '#111827' NOT NULL,
	"active_button_text_color" varchar(32) DEFAULT '#ffffff' NOT NULL,
	"description" text,
	"website" text,
	"address" text,
	"phone" varchar(64),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "floor_elements" (
	"id" text PRIMARY KEY NOT NULL,
	"floor_id" text NOT NULL,
	"type" varchar(32) NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"rotation" integer DEFAULT 0 NOT NULL,
	"name" varchar(255) NOT NULL,
	"capacity" integer,
	"equipment" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"floor" integer NOT NULL,
	"status" varchar(32),
	"reserved_by" varchar(255),
	"reserved_until" varchar(64),
	"time_slots" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"zone" varchar(128),
	"description" text,
	"label_font_family" varchar(128),
	"label_font_size" integer,
	"label_color" varchar(32),
	"label_offset_x" integer,
	"label_offset_y" integer
);
--> statement-breakpoint
CREATE TABLE "floors" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"floor_number" integer NOT NULL,
	"canvas_width" integer DEFAULT 1200 NOT NULL,
	"canvas_height" integer DEFAULT 800 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"user_id" text,
	"type" varchar(32) NOT NULL,
	"target_id" text NOT NULL,
	"resource_id" text,
	"name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"date" varchar(16) NOT NULL,
	"time_slot" varchar(32),
	"meeting_title" varchar(255),
	"participant_count" integer,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"pending_approval" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(64) NOT NULL,
	"category" varchar(64),
	"location" varchar(255) NOT NULL,
	"serial_number" varchar(128),
	"description" text,
	"status" varchar(32) DEFAULT 'available' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"company_id" text,
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"department" varchar(128),
	"role" varchar(32) DEFAULT 'user' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "company_branding" ADD CONSTRAINT "company_branding_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor_elements" ADD CONSTRAINT "floor_elements_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;