import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  bigint,
  numeric,
  date,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Accounts table schema:
 * - table name: accounts
 * - fields: email, role, password, name, phone, position
 */
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("employee"),
  phone: varchar("phone", { length: 50 }),
  position: varchar("position", { length: 150 }),
  avatarUrl: text("avatar_url"),
  gender: varchar("gender", { length: 20 }).default("male"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Sessions table:
 * - Manages active authenticated user sessions
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Audit and Activity Logs table:
 * - Records authentication attempts, role changes, security events
 */
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("info"),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  sessions: many(sessions),
  logs: many(logs),
  timesheets: many(timesheets),
  pipelineFollowups: many(pipelineFollowups),
  permission: one(permissions, {
    fields: [accounts.id],
    references: [permissions.accountId],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  account: one(accounts, {
    fields: [sessions.accountId],
    references: [accounts.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  account: one(accounts, {
    fields: [logs.accountId],
    references: [accounts.id],
  }),
}));

/**
 * Timesheets table (Workday-style time tracking & approval system):
 * - Manages monthly and weekly work hours, projects, submission and review status
 */
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  year: integer("year").notNull().default(2026),
  month: integer("month").notNull().default(10), // 1-12
  weekNumber: integer("week_number").notNull().default(1), // 1-5
  startDate: date("start_date"),
  endDate: date("end_date"),
  periodLabel: varchar("period_label", { length: 100 }).notNull(),
  project: varchar("project", { length: 150 }).notNull().default(""),
  mondayHours: integer("monday_hours").notNull().default(8),
  tuesdayHours: integer("tuesday_hours").notNull().default(8),
  wednesdayHours: integer("wednesday_hours").notNull().default(8),
  thursdayHours: integer("thursday_hours").notNull().default(8),
  fridayHours: integer("friday_hours").notNull().default(8),
  saturdayHours: integer("saturday_hours").notNull().default(0),
  sundayHours: integer("sunday_hours").notNull().default(0),
  totalHours: integer("total_hours").notNull().default(40),
  status: varchar("status", { length: 50 }).notNull().default("submitted"), // submitted, approved, rejected, draft
  notes: text("notes"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  account: one(accounts, {
    fields: [timesheets.accountId],
    references: [accounts.id],
  }),
  reviewer: one(accounts, {
    fields: [timesheets.reviewedBy],
    references: [accounts.id],
  }),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;

export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;

/**
 * Candidates Table (Enforced Database Schema):
 */
export const candidates = pgTable("candidates", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  zipCode: text("zip_code"),
  education: text("education"),
  experienceYears: numeric("experience_years"),
  skills: text("skills").array().notNull().default(sql`'{}'::text[]`),
  workAuthorization: text("work_authorization"),
  licenseStatus: text("license_status"),
  graduationDate: date("graduation_date"),
  availabilityDate: date("availability_date"),
  source: text("source"),
  salaryExpectation: numeric("salary_expectation"),
  salaryCurrency: text("salary_currency"),
  pipelineStage: text("pipeline_stage").notNull().default("Lead"),
  assignedUserId: uuid("assigned_user_id"),
  notes: text("notes"),
  customData: jsonb("custom_data").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Follow-up Pipeline Table (Relational with Foreign Keys):
 * - References candidates and accounts directly with foreign keys
 */
export const pipelineFollowups = pgTable("pipeline_followups", {
  id: varchar("id", { length: 100 }).primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }),
  accountId: integer("account_id").references(() => accounts.id, { onDelete: "set null" }),
  entityType: varchar("entity_type", { length: 50 }).default("candidate"),
  entityId: varchar("entity_id", { length: 100 }),
  entityName: varchar("entity_name", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  stage: varchar("stage", { length: 100 }).notNull().default("Needs Follow-up"),
  followUpDate: varchar("follow_up_date", { length: 100 }).notNull(),
  shouldNotify: boolean("should_notify").notNull().default(true),
  priority: varchar("priority", { length: 50 }).notNull().default("high"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const candidatesRelations = relations(candidates, ({ many }) => ({
  pipelineFollowups: many(pipelineFollowups),
}));

export const pipelineFollowupsRelations = relations(pipelineFollowups, ({ one }) => ({
  candidate: one(candidates, {
    fields: [pipelineFollowups.candidateId],
    references: [candidates.id],
  }),
  account: one(accounts, {
    fields: [pipelineFollowups.accountId],
    references: [accounts.id],
  }),
}));
export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export type PipelineFollowup = typeof pipelineFollowups.$inferSelect;
export type NewPipelineFollowup = typeof pipelineFollowups.$inferInsert;

/**
 * Srimatrix Directory Table (Formerly srimatric):
 * - Core healthcare facilities, providers, beds, and contact details
 */
export const srimatrix = pgTable("srimatrix", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  facilityName: text("facility_name"),
  type: text("type").default("Candidate"),
  county: text("county"),
  administrator: text("administrator"),
  phone: text("phone"),
  email: text("email"),
  beds: integer("beds"),
  ownershipType: text("ownership_type"),
  education: text("education"),
  workAuthorization: text("work_authorization"),
  graduationDate: date("graduation_date"),
  licenseStatus: text("license_status"),
  state: text("state"),
  country: text("country"),
  city: text("city"),
  zipCode: text("zip_code"),
  availabilityDate: date("availability_date"),
  address: text("address"),
  contactStatusNotes: text("contact_status_notes"),
  timingStatus: text("timing_status"),
  isPriorityRegion: boolean("is_priority_region").default(false),
  assignedUserId: uuid("assigned_user_id"),
  pipelineStage: text("pipeline_stage").default("Lead"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Srimatrix = typeof srimatrix.$inferSelect;
export type NewSrimatrix = typeof srimatrix.$inferInsert;

/**
 * Mileage Entries Table:
 * - Distance, travel date, timesheet association & approval status
 */
export const mileageEntries = pgTable("mileage_entries", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  accountId: bigint("account_id", { mode: "number" })
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  timesheetId: bigint("timesheet_id", { mode: "number" })
    .references(() => timesheets.id, { onDelete: "set null" }),
  entryDate: date("entry_date").notNull(),
  distance: numeric("distance").notNull().default("0.00"),
  unit: text("unit").notNull().default("miles"),
  description: text("description"),
  status: text("status").notNull().default("Draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mileageEntriesRelations = relations(mileageEntries, ({ one }) => ({
  account: one(accounts, {
    fields: [mileageEntries.accountId],
    references: [accounts.id],
  }),
  timesheet: one(timesheets, {
    fields: [mileageEntries.timesheetId],
    references: [timesheets.id],
  }),
}));

export type MileageEntry = typeof mileageEntries.$inferSelect;
export type NewMileageEntry = typeof mileageEntries.$inferInsert;

/**
 * Email Credentials Table:
 * - Stores email app password/key, email address, and logo boolean toggle linked to accountId
 */
export const emailCredentials = pgTable("email_credentials", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  key: text("key").notNull(),
  logoOn: boolean("logo_on").notNull().default(false),
  signature: text("signature").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const emailCredentialsRelations = relations(emailCredentials, ({ one }) => ({
  account: one(accounts, {
    fields: [emailCredentials.accountId],
    references: [accounts.id],
  }),
}));

export type EmailCredential = typeof emailCredentials.$inferSelect;
export type NewEmailCredential = typeof emailCredentials.$inferInsert;

/**
 * Applications Table:
 * - Stores application name, full JSON document content, created on, and updated on
 */
export const jobOfferLetters = pgTable("job_offer_letters", {
  id: serial("id").primaryKey(),
  applicationName: varchar("application_name", { length: 255 }).notNull().default("Application 1"),
  fileUrl: text("file_url"),
  content: jsonb("content").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


export type JobOfferLetter = typeof jobOfferLetters.$inferSelect;
export type NewJobOfferLetter = typeof jobOfferLetters.$inferInsert;

/**
 * Permissions Table:
 * - Boolean-based permissions per account for tabs, widgets, and superadmin privileges
 */
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .unique()
    .references(() => accounts.id, { onDelete: "cascade" }),
  // Tabs (Boolean Flags)
  tabOverview: boolean("tab_overview").notNull().default(false),
  tabSrimatrix: boolean("tab_srimatrix").notNull().default(false),
  tabCandidates: boolean("tab_candidates").notNull().default(false),
  tabPipeline: boolean("tab_pipeline").notNull().default(false),
  tabJob: boolean("tab_job").notNull().default(false),
  tabMileage: boolean("tab_mileage").notNull().default(true),
  tabMileageManage: boolean("tab_mileage_manage").notNull().default(false),
  tabReviewing: boolean("tab_reviewing").notNull().default(false),
  tabAccounts: boolean("tab_accounts").notNull().default(false),
  tabMail: boolean("tab_mail").notNull().default(false),
  tabCredentials: boolean("tab_credentials").notNull().default(false),
  tabSessions: boolean("tab_sessions").notNull().default(false),
  tabLogs: boolean("tab_logs").notNull().default(false),
  tabTimesheets: boolean("tab_timesheets").notNull().default(true),
  // Widgets (Boolean Flags)
  widgetKpiMetrics: boolean("widget_kpi_metrics").notNull().default(true),
  widgetEntityCards: boolean("widget_entity_cards").notNull().default(true),
  widgetAnalyticsChart: boolean("widget_analytics_chart").notNull().default(true),
  widgetFollowupTicker: boolean("widget_followup_ticker").notNull().default(true),
  widgetEmailFeed: boolean("widget_email_feed").notNull().default(true),
  // SuperAdmin & Access Flags
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  canManagePermissions: boolean("can_manage_permissions").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const permissionsRelations = relations(permissions, ({ one }) => ({
  account: one(accounts, {
    fields: [permissions.accountId],
    references: [accounts.id],
  }),
}));

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

/**
 * Immigration Cases Table:
 * - Tracks USCIS cases, foreign national healthcare worker visas (H-1B, TN, OPT, EB-2/EB-3 Schedule A)
 * - Expiration dates, LCA filings, prevailing wages, and USCIS petition stages
 */
export const immigrationCases = pgTable("immigration_cases", {
  id: serial("id").primaryKey(),
  employeeName: varchar("employee_name", { length: 255 }).notNull(),
  visaType: varchar("visa_type", { length: 100 }).notNull(),
  caseNumber: varchar("case_number", { length: 100 }),
  uscisStage: varchar("uscis_stage", { length: 100 }).default("Petition Filed"),
  filingDate: date("filing_date"),
  approvalDate: date("approval_date"),
  expirationDate: date("expiration_date").notNull(),
  priorityDate: date("priority_date"),
  lcaNumber: varchar("lca_number", { length: 100 }),
  prevailingWage: varchar("prevailing_wage", { length: 100 }),
  workLocation: varchar("work_location", { length: 255 }),
  jobTitle: varchar("job_title", { length: 150 }),
  status: varchar("status", { length: 50 }).notNull().default("Active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ImmigrationCase = typeof immigrationCases.$inferSelect;
export type NewImmigrationCase = typeof immigrationCases.$inferInsert;

/**
 * HR Documents Table:
 * - Central repository for employee agreements, tax forms (W-4, I-9), licenses & certifications
 */
export const hrDocuments = pgTable("hr_documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull().default("Agreements"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: varchar("file_size", { length: 50 }).notNull().default("1.0 MB"),
  fileUrl: text("file_url"),
  uploadedBy: varchar("uploaded_by", { length: 255 }).default("HR Administration"),
  status: varchar("status", { length: 50 }).notNull().default("Verified"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type HRDocument = typeof hrDocuments.$inferSelect;
export type NewHRDocument = typeof hrDocuments.$inferInsert;

/**
 * Invoices Table:
 * - Healthcare facility billing, shift rate calculations, contractor reimbursements, and payment lifecycle
 */
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  clientAddress: text("client_address"),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0.00"),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  paidDate: date("paid_date"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  lineItems: jsonb("line_items").notNull().default([]),
  notes: text("notes"),
  terms: text("terms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;


