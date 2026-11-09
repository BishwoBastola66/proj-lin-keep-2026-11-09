CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"position" varchar(255),
	"department" varchar(150),
	"status" varchar(50) DEFAULT 'Applied' NOT NULL,
	"experience" varchar(100),
	"location" varchar(255),
	"skills" text,
	"education" text,
	"source" varchar(100),
	"salary_expectation" varchar(100),
	"notes" text,
	"custom_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates_sheets" (
	"id" varchar(50) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"columns" text NOT NULL,
	"records" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_name" varchar(255) NOT NULL,
	"industry" varchar(255),
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"phone" varchar(100),
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip" varchar(20),
	"county" varchar(100),
	"contract_tier" varchar(100) DEFAULT 'Enterprise',
	"monthly_billing" varchar(100),
	"status" varchar(50) DEFAULT 'Active' NOT NULL,
	"notes" text,
	"custom_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients_sheets" (
	"id" varchar(50) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"columns" text NOT NULL,
	"records" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer,
	"action" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'info' NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_followups" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"client_id" integer,
	"candidate_id" integer,
	"account_id" integer,
	"entity_type" varchar(50) DEFAULT 'client',
	"entity_id" varchar(100),
	"entity_name" varchar(255),
	"contact_email" varchar(255),
	"title" varchar(255) NOT NULL,
	"stage" varchar(100) DEFAULT 'Needs Follow-up' NOT NULL,
	"follow_up_date" varchar(100) NOT NULL,
	"should_notify" boolean DEFAULT true NOT NULL,
	"priority" varchar(50) DEFAULT 'high' NOT NULL,
	"notes" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"token" text NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" integer NOT NULL,
	"year" integer DEFAULT 2026 NOT NULL,
	"month" integer DEFAULT 10 NOT NULL,
	"week_number" integer DEFAULT 1 NOT NULL,
	"period_label" varchar(100) NOT NULL,
	"project" varchar(150) DEFAULT 'Platform & Core Engineering' NOT NULL,
	"monday_hours" integer DEFAULT 8 NOT NULL,
	"tuesday_hours" integer DEFAULT 8 NOT NULL,
	"wednesday_hours" integer DEFAULT 8 NOT NULL,
	"thursday_hours" integer DEFAULT 8 NOT NULL,
	"friday_hours" integer DEFAULT 8 NOT NULL,
	"saturday_hours" integer DEFAULT 0 NOT NULL,
	"sunday_hours" integer DEFAULT 0 NOT NULL,
	"total_hours" integer DEFAULT 40 NOT NULL,
	"status" varchar(50) DEFAULT 'submitted' NOT NULL,
	"notes" text,
	"review_note" text,
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "superior_id" integer;--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_followups" ADD CONSTRAINT "pipeline_followups_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_followups" ADD CONSTRAINT "pipeline_followups_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_followups" ADD CONSTRAINT "pipeline_followups_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_reviewed_by_accounts_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;