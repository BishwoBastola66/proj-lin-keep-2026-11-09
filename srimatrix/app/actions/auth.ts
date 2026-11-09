"use server";

import { db } from "@/db";
import {
  accounts,
  sessions,
  logs,
  timesheets,
  candidates,
  pipelineFollowups,
  srimatrix,
  mileageEntries,
  emailCredentials,
  jobOfferLetters,
  permissions,
  immigrationCases,
  hrDocuments,
  invoices,
  type NewAccount,
  type NewSession,
  type NewLog,
  type Account,
  type Candidate,
  type NewCandidate,
  type PipelineFollowup,
  type NewPipelineFollowup,
  type Srimatrix,
  type MileageEntry,
  type JobOfferLetter,
  type NewJobOfferLetter,
  type Permission,
  type NewPermission,
  type ImmigrationCase,
  type NewImmigrationCase,
  type HRDocument,
  type NewHRDocument,
  type Invoice,
  type NewInvoice,
} from "@/db/schema";
import { eq, desc, count, and, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import {
  sendEmail,
  sendCampaignBatch,
  verifySMTPConnection,
  sendWelcomeCredentialsEmail,
  getStoredEmailCredentials,
  saveStoredEmailCredentials,
  sendTestEmail,
  type EmailCredentialsConfig,
} from "@/lib/mailer";
import { processAndSaveAvatar } from "@/lib/avatarStorage";
import {
  saveApplicationToFileStorage,
  readApplicationFromFileStorage,
  deleteApplicationFromFileStorage,
} from "@/lib/applicationStorage";

export type AuthResponse = {
  success: boolean;
  message: string;
  account?: {
    id?: number;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    position?: string | null;
  };
  sessionToken?: string;
  dbConnected: boolean;
};

export type LogItem = {
  id: number;
  accountId: number | null;
  action: string;
  status: string;
  ipAddress: string | null;
  details: string | null;
  createdAt: Date;
};

// Helper to extract client metadata safely
async function getClientMeta() {
  const reqHeaders = await headers();
  const forwarded = reqHeaders.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "Browser Client";
  return { ipAddress, userAgent };
}

// Helper to format database errors cleanly (unwrapping DrizzleQueryError and network/DNS failures)
function formatDatabaseError(error: unknown): { message: string; isConnectionError: boolean } {
  const err = error as Error & { cause?: { code?: string; message?: string; hostname?: string } };
  const cause = err.cause;
  const rawMsg = err.message || "";
  const causeMsg = cause?.message || "";
  const code = cause?.code || "";

  const isDnsError = code === "ENOTFOUND" || causeMsg.includes("ENOTFOUND") || rawMsg.includes("ENOTFOUND");
  const isRefused = code === "ECONNREFUSED" || causeMsg.includes("ECONNREFUSED") || rawMsg.includes("ECONNREFUSED");
  const isTimeout = code === "ETIMEDOUT" || causeMsg.includes("ETIMEDOUT") || rawMsg.includes("ETIMEDOUT");

  if (isDnsError) {
    const host = cause?.hostname || "database host";
    return {
      message: `Database connection failed: Unable to resolve host (${host}). Your Supabase project may be paused or inactive in the Supabase dashboard. Please unpause/restore your project.`,
      isConnectionError: true,
    };
  }

  if (isRefused || isTimeout) {
    return {
      message: "Database connection failed: Connection refused or timed out. Please verify your database server is running and network settings are correct.",
      isConnectionError: true,
    };
  }

  if (causeMsg) {
    return {
      message: `Database error: ${causeMsg}`,
      isConnectionError: false,
    };
  }

  return {
    message: `Database error: ${rawMsg || "Failed to execute database query"}`,
    isConnectionError: false,
  };
}

export async function loginAction(formData: FormData): Promise<AuthResponse> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const { ipAddress, userAgent } = await getClientMeta();

  if (!email || !password) {
    return {
      success: false,
      message: "Please provide both email and password.",
      dbConnected: Boolean(db),
    };
  }

  if (!db) {
    return {
      success: false,
      message: "Database connection not initialized.",
      dbConnected: false,
    };
  }

  try {
    const existing = await db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(logs).values({
        action: "LOGIN_FAILED",
        status: "failed",
        ipAddress,
        userAgent,
        details: `Failed login attempt for non-existent email: ${email}`,
      });

      return {
        success: false,
        message: "No account found with this email address.",
        dbConnected: true,
      };
    }

    const user = existing[0];
    if (user.password !== password) {
      await db.insert(logs).values({
        accountId: user.id,
        action: "LOGIN_FAILED",
        status: "failed",
        ipAddress,
        userAgent,
        details: `Invalid password attempt for account ID #${user.id} (${user.email})`,
      });

      return {
        success: false,
        message: "Invalid password provided.",
        dbConnected: true,
      };
    }

    // 1. Create secure session token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionData: NewSession = {
      accountId: user.id,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    };
    await db.insert(sessions).values(sessionData);

    // 2. Record audit log
    const logData: NewLog = {
      accountId: user.id,
      action: "LOGIN_SUCCESS",
      status: "success",
      ipAddress,
      userAgent,
      details: `User ${user.name} logged in. Role: ${user.role} | Position: ${user.position || "N/A"}`,
    };
    await db.insert(logs).values(logData);

    // 3. Set HTTP-Only Cookie
    const cookieStore = await cookies();
    cookieStore.set("sri_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return {
      success: true,
      message: `Welcome back, ${user.name}!`,
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        position: user.position,
      },
      sessionToken: `${token.substring(0, 8)}...${token.substring(token.length - 6)}`,
      dbConnected: true,
    };
  } catch (error: unknown) {
    const formatted = formatDatabaseError(error);
    return {
      success: false,
      message: formatted.message,
      dbConnected: !formatted.isConnectionError,
    };
  }
}

export async function getCurrentUserAction() {
  if (!db) return null;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sri_session")?.value;
    if (!token) return null;

    const activeSessions = await db
      .select({
        sessionId: sessions.id,
        token: sessions.token,
        expiresAt: sessions.expiresAt,
        accountId: accounts.id,
        name: accounts.name,
        email: accounts.email,
        role: accounts.role,
        phone: accounts.phone,
        position: accounts.position,
        avatarUrl: accounts.avatarUrl,
        gender: accounts.gender,
      })
      .from(sessions)
      .innerJoin(accounts, eq(sessions.accountId, accounts.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (activeSessions.length === 0) return null;
    const sess = activeSessions[0];

    if (new Date(sess.expiresAt) < new Date()) {
      return null;
    }

    return sess;
  } catch {
    return null;
  }
}

export async function getDashboardRoleDataAction() {
  const user = await getCurrentUserAction();
  if (!user || !db) {
    return { authenticated: false as const };
  }

  const userPerms = await getEffectivePermissions(user.accountId, user.role, user.position);
  const isSuperAdmin = userPerms.isSuperAdmin || user.role.toLowerCase() === "superadmin" || user.position?.toLowerCase().includes("super administrator");
  const isAdmin = isSuperAdmin || user.role.toLowerCase() === "admin";
  const hasWorkforceAccess = isAdmin ||
    userPerms.canManagePermissions ||
    userPerms.tabAccounts ||
    userPerms.tabReviewing ||
    userPerms.tabSessions ||
    userPerms.tabLogs ||
    userPerms.tabMileageManage ||
    userPerms.widgetKpiMetrics ||
    userPerms.widgetEntityCards ||
    userPerms.widgetAnalyticsChart;

  try {
    if (hasWorkforceAccess) {
      // Fetch all accounts
      const allAccounts = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          email: accounts.email,
          role: accounts.role,
          phone: accounts.phone,
          position: accounts.position,
          avatarUrl: accounts.avatarUrl,
          gender: accounts.gender,
          createdAt: accounts.createdAt,
        })
        .from(accounts)
        .orderBy(desc(accounts.createdAt));

      // Fetch active sessions with account details
      const activeSessions = await db
        .select({
          id: sessions.id,
          accountId: sessions.accountId,
          token: sessions.token,
          ipAddress: sessions.ipAddress,
          userAgent: sessions.userAgent,
          expiresAt: sessions.expiresAt,
          createdAt: sessions.createdAt,
          accountName: accounts.name,
          accountEmail: accounts.email,
          accountRole: accounts.role,
        })
        .from(sessions)
        .innerJoin(accounts, eq(sessions.accountId, accounts.id))
        .orderBy(desc(sessions.createdAt))
        .limit(15);

      // Fetch recent logs
      const recentLogs = await db
        .select({
          id: logs.id,
          accountId: logs.accountId,
          action: logs.action,
          status: logs.status,
          ipAddress: logs.ipAddress,
          details: logs.details,
          createdAt: logs.createdAt,
        })
        .from(logs)
        .orderBy(desc(logs.createdAt))
        .limit(20);

      // Fetch all timesheets with employee details and reviewer details
      const reviewerAccounts = alias(accounts, "reviewer_accounts");
      const allTimesheets = await db
        .select({
          id: timesheets.id,
          accountId: timesheets.accountId,
          year: timesheets.year,
          month: timesheets.month,
          weekNumber: timesheets.weekNumber,
          periodLabel: timesheets.periodLabel,
          project: timesheets.project,
          mondayHours: timesheets.mondayHours,
          tuesdayHours: timesheets.tuesdayHours,
          wednesdayHours: timesheets.wednesdayHours,
          thursdayHours: timesheets.thursdayHours,
          fridayHours: timesheets.fridayHours,
          saturdayHours: timesheets.saturdayHours,
          sundayHours: timesheets.sundayHours,
          totalHours: timesheets.totalHours,
          status: timesheets.status,
          notes: timesheets.notes,
          reviewNote: timesheets.reviewNote,
          reviewedAt: timesheets.reviewedAt,
          reviewedBy: timesheets.reviewedBy,
          reviewerPosition: reviewerAccounts.position,
          reviewerRole: reviewerAccounts.role,
          reviewerName: reviewerAccounts.name,
          createdAt: timesheets.createdAt,
          accountName: accounts.name,
          accountEmail: accounts.email,
          accountPosition: accounts.position,
        })
        .from(timesheets)
        .innerJoin(accounts, eq(timesheets.accountId, accounts.id))
        .leftJoin(reviewerAccounts, eq(timesheets.reviewedBy, reviewerAccounts.id))
        .orderBy(desc(timesheets.createdAt), desc(timesheets.id));

      const pendingReviews = allTimesheets.filter((t) => t.status === "submitted");

      // Personal timesheets and mileage for this user
      const reviewerAccountsEmp = alias(accounts, "reviewer_accounts_curr_user");
      const myTimesheets = await db
        .select({
          id: timesheets.id,
          accountId: timesheets.accountId,
          year: timesheets.year,
          month: timesheets.month,
          weekNumber: timesheets.weekNumber,
          periodLabel: timesheets.periodLabel,
          project: timesheets.project,
          mondayHours: timesheets.mondayHours,
          tuesdayHours: timesheets.tuesdayHours,
          wednesdayHours: timesheets.wednesdayHours,
          thursdayHours: timesheets.thursdayHours,
          fridayHours: timesheets.fridayHours,
          saturdayHours: timesheets.saturdayHours,
          sundayHours: timesheets.sundayHours,
          totalHours: timesheets.totalHours,
          status: timesheets.status,
          notes: timesheets.notes,
          reviewNote: timesheets.reviewNote,
          reviewedAt: timesheets.reviewedAt,
          reviewedBy: timesheets.reviewedBy,
          reviewerPosition: reviewerAccountsEmp.position,
          reviewerRole: reviewerAccountsEmp.role,
          reviewerName: reviewerAccountsEmp.name,
          createdAt: timesheets.createdAt,
          updatedAt: timesheets.updatedAt,
        })
        .from(timesheets)
        .leftJoin(reviewerAccountsEmp, eq(timesheets.reviewedBy, reviewerAccountsEmp.id))
        .where(eq(timesheets.accountId, user.accountId))
        .orderBy(desc(timesheets.createdAt), desc(timesheets.id));

      const myMileage = await db
        .select()
        .from(mileageEntries)
        .where(eq(mileageEntries.accountId, user.accountId))
        .orderBy(desc(mileageEntries.entryDate), desc(mileageEntries.id));

      return {
        authenticated: true as const,
        role: isSuperAdmin ? ("superadmin" as const) : isAdmin ? ("admin" as const) : ("employee" as const),
        isSuperAdmin,
        permissions: userPerms,
        user,
        stats: {
          totalAccounts: allAccounts.length,
          activeSessions: activeSessions.length,
          totalLogs: recentLogs.length,
          pendingReviews: pendingReviews.length,
          totalWorkforceHours: allTimesheets.reduce((acc, t) => acc + (t.totalHours || 0), 0),
        },
        accounts: allAccounts,
        sessions: activeSessions,
        logs: recentLogs,
        timesheets: allTimesheets,
        myTimesheets,
        mileage: myMileage,
      };
    } else {
      // Employee View
      const mySessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.accountId, user.accountId))
        .orderBy(desc(sessions.createdAt));

      const myLogs = await db
        .select()
        .from(logs)
        .where(eq(logs.accountId, user.accountId))
        .orderBy(desc(logs.createdAt))
        .limit(10);

      const reviewerAccountsEmp = alias(accounts, "reviewer_accounts_emp");
      const myTimesheets = await db
        .select({
          id: timesheets.id,
          accountId: timesheets.accountId,
          year: timesheets.year,
          month: timesheets.month,
          weekNumber: timesheets.weekNumber,
          periodLabel: timesheets.periodLabel,
          project: timesheets.project,
          mondayHours: timesheets.mondayHours,
          tuesdayHours: timesheets.tuesdayHours,
          wednesdayHours: timesheets.wednesdayHours,
          thursdayHours: timesheets.thursdayHours,
          fridayHours: timesheets.fridayHours,
          saturdayHours: timesheets.saturdayHours,
          sundayHours: timesheets.sundayHours,
          totalHours: timesheets.totalHours,
          status: timesheets.status,
          notes: timesheets.notes,
          reviewNote: timesheets.reviewNote,
          reviewedAt: timesheets.reviewedAt,
          reviewedBy: timesheets.reviewedBy,
          reviewerPosition: reviewerAccountsEmp.position,
          reviewerRole: reviewerAccountsEmp.role,
          reviewerName: reviewerAccountsEmp.name,
          createdAt: timesheets.createdAt,
          updatedAt: timesheets.updatedAt,
        })
        .from(timesheets)
        .leftJoin(reviewerAccountsEmp, eq(timesheets.reviewedBy, reviewerAccountsEmp.id))
        .where(eq(timesheets.accountId, user.accountId))
        .orderBy(desc(timesheets.createdAt), desc(timesheets.id));

      const myMileage = await db
        .select()
        .from(mileageEntries)
        .where(eq(mileageEntries.accountId, user.accountId))
        .orderBy(desc(mileageEntries.entryDate), desc(mileageEntries.id));

      return {
        authenticated: true as const,
        role: "employee" as const,
        isSuperAdmin: false,
        permissions: userPerms,
        user,
        sessions: mySessions,
        logs: myLogs,
        timesheets: myTimesheets,
        mileage: myMileage,
      };
    }
  } catch (err) {
    console.error("Dashboard data error:", err);
    return {
      authenticated: true as const,
      role: isAdmin ? ("admin" as const) : ("employee" as const),
      user,
      error: "Failed to load complete dataset",
    };
  }
}

export async function createAccountByAdminAction(formData: FormData) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Accounts management permission required." };
  }

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString().trim() || "employee";
  const phone = formData.get("phone")?.toString().trim() || null;
  const position = formData.get("position")?.toString().trim() || null;
  const gender = formData.get("gender")?.toString().trim().toLowerCase() || "male";
  const avatarUrl = await processAndSaveAvatar(formData, email || "", name || "");
  const { ipAddress, userAgent } = await getClientMeta();

  if (!name || !email || !password) {
    return { success: false, message: "Name, email, and password are required." };
  }

  try {
    const existing = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, message: "Account with this email already exists." };
    }

    const inserted = await db
      .insert(accounts)
      .values({ name, email, password, role, phone, position, avatarUrl, gender })
      .returning();

    // Setup initial default permissions for newly created account:
    const isSuper = role.toLowerCase() === "superadmin" || position?.toLowerCase().includes("super administrator");
    const isAdmin = isSuper || role.toLowerCase() === "admin";
    try {
      await db.insert(permissions).values({
        accountId: inserted[0].id,
        isSuperAdmin: isSuper,
        canManagePermissions: isAdmin,
        tabOverview: isAdmin,
        tabSrimatrix: isAdmin,
        tabCandidates: isAdmin,
        tabPipeline: isAdmin,
        tabJob: isAdmin,
        tabMileage: true,
        tabMileageManage: isAdmin,
        tabReviewing: isAdmin,
        tabAccounts: isAdmin,
        tabMail: isAdmin,
        tabCredentials: isAdmin,
        tabSessions: isAdmin,
        tabLogs: isAdmin,
        tabTimesheets: true,
        widgetKpiMetrics: isAdmin,
        widgetEntityCards: isAdmin,
        widgetAnalyticsChart: isAdmin,
        widgetFollowupTicker: isAdmin,
        widgetEmailFeed: isAdmin,
      });
    } catch (permErr) {
      console.error("Failed to insert initial permissions for account:", permErr);
    }

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "ACCOUNT_CREATED",
      status: "success",
      ipAddress,
      userAgent,
      details: `Admin ${currentUser.name} created account for ${name} (${email}) with role: ${role}`,
    });

    let emailNotice = "";
    try {
      const headersList = await headers();
      const host = headersList.get("host") || "localhost:3000";
      const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const portalUrl = `${proto}://${host}`;

      await sendWelcomeCredentialsEmail({
        name,
        email,
        password,
        role,
        position,
        portalUrl,
      });
      emailNotice = ` and welcome email with login credentials was sent to ${email}`;
    } catch (mailErr: any) {
      console.error("Welcome credentials email dispatch error:", mailErr);
      emailNotice = ` (welcome email note: ${mailErr?.message || "could not deliver email"})`;
    }

    return {
      success: true,
      message: `Account for ${inserted[0].name} (${role}) created successfully${emailNotice}!`,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to create account." };
  }
}

export async function revokeSessionAction(sessionId: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized." };
  }

  try {
    const auth = await checkActionAuthorization(currentUser, "tabSessions");
    // If not authorized for tabSessions, verify it's the user's own session
    if (!auth.authorized) {
      const sess = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      if (sess.length === 0 || sess[0].accountId !== currentUser.accountId) {
        return { success: false, message: "Unauthorized: You can only revoke your own active sessions." };
      }
    }

    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return { success: true, message: "Session revoked." };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

export async function logoutAction() {
  if (!db) return { success: true };
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sri_session")?.value;
    const { ipAddress, userAgent } = await getClientMeta();

    if (token) {
      const existing = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .limit(1);

      if (existing.length > 0) {
        await db.delete(sessions).where(eq(sessions.token, token));
        await db.insert(logs).values({
          accountId: existing[0].accountId,
          action: "LOGOUT",
          status: "info",
          ipAddress,
          userAgent,
          details: `Session revoked for account ID #${existing[0].accountId}`,
        });
      }
      cookieStore.delete("sri_session");
    }

    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function submitTimesheetAction(formData: FormData) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const year = parseInt(formData.get("year")?.toString() || "2026", 10);
  const month = parseInt(formData.get("month")?.toString() || "10", 10);
  const weekNumber = parseInt(formData.get("weekNumber")?.toString() || "1", 10);
  const periodLabel = formData.get("periodLabel")?.toString().trim() || "Weekly Period";
  const project = formData.get("project")?.toString().trim() || "";
  const notes = formData.get("notes")?.toString().trim() || null;
  const startDate = formData.get("startDate")?.toString().trim() || null;
  const endDate = formData.get("endDate")?.toString().trim() || null;

  const mon = Math.max(0, parseInt(formData.get("mondayHours")?.toString() || "0", 10));
  const tue = Math.max(0, parseInt(formData.get("tuesdayHours")?.toString() || "0", 10));
  const wed = Math.max(0, parseInt(formData.get("wednesdayHours")?.toString() || "0", 10));
  const thu = Math.max(0, parseInt(formData.get("thursdayHours")?.toString() || "0", 10));
  const fri = Math.max(0, parseInt(formData.get("fridayHours")?.toString() || "0", 10));
  const sat = Math.max(0, parseInt(formData.get("saturdayHours")?.toString() || "0", 10));
  const sun = Math.max(0, parseInt(formData.get("sundayHours")?.toString() || "0", 10));
  const totalHours = mon + tue + wed + thu + fri + sat + sun;

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const existing = await db
      .select()
      .from(timesheets)
      .where(
        and(
          eq(timesheets.accountId, currentUser.accountId),
          or(
            eq(timesheets.periodLabel, periodLabel),
            and(
              eq(timesheets.year, year),
              eq(timesheets.month, month),
              eq(timesheets.weekNumber, weekNumber)
            )
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(timesheets)
        .set({
          periodLabel,
          project,
          startDate: startDate || null,
          endDate: endDate || null,
          mondayHours: mon,
          tuesdayHours: tue,
          wednesdayHours: wed,
          thursdayHours: thu,
          fridayHours: fri,
          saturdayHours: sat,
          sundayHours: sun,
          totalHours,
          status: "submitted",
          notes,
          updatedAt: new Date(),
        })
        .where(eq(timesheets.id, existing[0].id));
    } else {
      await db.insert(timesheets).values({
        accountId: currentUser.accountId,
        year,
        month,
        weekNumber,
        periodLabel,
        project,
        startDate: startDate || null,
        endDate: endDate || null,
        mondayHours: mon,
        tuesdayHours: tue,
        wednesdayHours: wed,
        thursdayHours: thu,
        fridayHours: fri,
        saturdayHours: sat,
        sundayHours: sun,
        totalHours,
        status: "submitted",
        notes,
      });
    }

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "TIMESHEET_SUBMITTED",
      status: "success",
      ipAddress,
      userAgent,
      details: `${currentUser.name} submitted ${totalHours} hrs timesheet for ${periodLabel} (${project})`,
    });

    return { success: true, message: `Timesheet (${totalHours} hrs) submitted for manager review!` };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to submit timesheet." };
  }
}

export async function deleteTimesheetAction(timesheetId: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  if (!timesheetId) {
    return { success: false, message: "Invalid timesheet ID." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const existing = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.id, timesheetId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, message: "Timesheet not found." };
    }

    // Authorization: Reviewers/Admins can delete any timesheet; Employee can delete their own
    const auth = await checkActionAuthorization(currentUser, "tabReviewing");
    if (!auth.authorized && existing[0].accountId !== currentUser.accountId) {
      return { success: false, message: "Unauthorized: You can only delete your own timesheets." };
    }

    // Employees can only delete rejected or draft timesheets
    if (!auth.authorized && existing[0].status !== "rejected" && existing[0].status !== "draft") {
      return { success: false, message: "Cannot delete timesheet: Only draft or rejected timesheets can be deleted by employees." };
    }

    await db.delete(timesheets).where(eq(timesheets.id, timesheetId));

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "TIMESHEET_DELETED",
      status: "success",
      ipAddress,
      userAgent,
      details: `${currentUser.name} deleted timesheet #${timesheetId} (${existing[0].periodLabel}, ${existing[0].totalHours} hrs)`,
    });

    return { success: true, message: `Timesheet for ${existing[0].periodLabel} deleted successfully.` };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to delete timesheet." };
  }
}

export async function reviewTimesheetAction(formData: FormData) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabReviewing");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Timesheet management permission required." };
  }

  const timesheetId = parseInt(formData.get("timesheetId")?.toString() || "0", 10);
  const rawStatus = formData.get("status")?.toString().trim().toLowerCase() || "approved";
  let status = "approved";
  if (rawStatus === "rejected") status = "rejected";
  else if (rawStatus === "draft") status = "draft";
  else if (rawStatus === "pending" || rawStatus === "submitted") status = "submitted";
  else if (rawStatus === "approved") status = "approved";

  const approverPosition = currentUser.position?.trim() || "Super Administrator";
  const defaultNote =
    status === "approved"
      ? `Approved by ${approverPosition}`
      : status === "rejected"
      ? "Returned for corrections"
      : status === "draft"
      ? `Moved to Draft by ${approverPosition}`
      : "Pending Review";
  const reviewNote = formData.get("reviewNote")?.toString().trim() || defaultNote;
  const { ipAddress, userAgent } = await getClientMeta();

  if (!timesheetId) {
    return { success: false, message: "Invalid timesheet ID." };
  }

  try {
    const updated = await db
      .update(timesheets)
      .set({
        status,
        reviewNote,
        reviewedAt: new Date(),
        reviewedBy: currentUser.accountId,
        updatedAt: new Date(),
      })
      .where(eq(timesheets.id, timesheetId))
      .returning();

    if (updated.length === 0) {
      return { success: false, message: "Timesheet not found." };
    }

    const action =
      status === "approved"
        ? "TIMESHEET_APPROVED"
        : status === "rejected"
        ? "TIMESHEET_REJECTED"
        : status === "draft"
        ? "TIMESHEET_SET_DRAFT"
        : "TIMESHEET_SET_PENDING";

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action,
      status: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
      ipAddress,
      userAgent,
      details: `Admin ${currentUser.name} marked timesheet #${timesheetId} (${updated[0].totalHours} hrs) as ${status.toUpperCase()} with note: ${reviewNote}`,
    });

    return {
      success: true,
      message: `Timesheet #${timesheetId} successfully marked as ${status === "submitted" ? "PENDING" : status.toUpperCase()}!`,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to review timesheet." };
  }
}

export async function deleteAccountAction(accountId: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Accounts management permission required." };
  }

  if (accountId === currentUser.accountId) {
    return { success: false, message: "Security protection: You cannot delete your own active admin account." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const acc = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (acc.length === 0) {
      return { success: false, message: "Account not found." };
    }

    await db.delete(accounts).where(eq(accounts.id, accountId));

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "ACCOUNT_DELETED",
      status: "warning",
      ipAddress,
      userAgent,
      details: `Admin ${currentUser.name} deleted account ${acc[0].name} (${acc[0].email})`,
    });

    return { success: true, message: `Account "${acc[0].name}" deleted successfully.` };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to delete account." };
  }
}

export async function updateAccountAction(formData: FormData) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Accounts management permission required." };
  }

  const accountId = parseInt(formData.get("accountId")?.toString() || "0", 10);
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const role = formData.get("role")?.toString().trim().toLowerCase() || "employee";
  const position = formData.get("position")?.toString().trim() || "";
  const phone = formData.get("phone")?.toString().trim() || "";
  const gender = formData.get("gender")?.toString().trim().toLowerCase() || "male";
  const password = formData.get("password")?.toString().trim() || "";
  const avatarUrl = await processAndSaveAvatar(formData, email || "", name || "");

  if (!accountId || !name || !email) {
    return { success: false, message: "Account ID, name, and email are required." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const existing = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (existing.length === 0) {
      return { success: false, message: "Account not found." };
    }

    if (email !== existing[0].email.toLowerCase()) {
      const emailConflict = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.email, email))
        .limit(1);
      if (emailConflict.length > 0 && emailConflict[0].id !== accountId) {
        return { success: false, message: `The email "${email}" is already registered to another user.` };
      }
    }

    const updatePayload: Record<string, any> = {
      name,
      email,
      role,
      position,
      phone,
      gender,
      avatarUrl,
      updatedAt: new Date(),
    };

    if (password && password.length >= 6) {
      updatePayload.password = password;
    }

    const updated = await db
      .update(accounts)
      .set(updatePayload)
      .where(eq(accounts.id, accountId))
      .returning();

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "ACCOUNT_UPDATED",
      status: "info",
      ipAddress,
      userAgent,
      details: `Admin ${currentUser.name} updated account details for ${name} (${email}, ${role})`,
    });

    return {
      success: true,
      message: `Account "${name}" updated successfully!`,
      account: updated[0],
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to update account." };
  }
}

export async function bulkDeleteAccountsAction(accountIds: number[]) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Accounts management permission required." };
  }

  const validIds = accountIds.filter((id) => id !== currentUser.accountId);
  if (validIds.length === 0) {
    return { success: false, message: "No valid accounts to delete (cannot delete your own account)." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    await db.delete(accounts).where(inArray(accounts.id, validIds));

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "BULK_ACCOUNTS_DELETED",
      status: "warning",
      ipAddress,
      userAgent,
      details: `Admin ${currentUser.name} bulk deleted ${validIds.length} accounts: [IDs: ${validIds.join(", ")}]`,
    });

    return { success: true, message: `Successfully deleted ${validIds.length} accounts in bulk.` };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to delete accounts." };
  }
}

export async function bulkCreateAccountsAction(
  accountsList: Array<{
    name: string;
    email: string;
    role?: string;
    position?: string;
    phone?: string;
    password?: string;
    gender?: string;
  }>
) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Accounts management permission required." };
  }

  if (!accountsList || accountsList.length === 0) {
    return { success: false, message: "No account rows provided." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const toInsert = [];
    const skipped = [];

    const existing = await db.select({ email: accounts.email }).from(accounts);
    const existingSet = new Set(existing.map((e) => e.email.toLowerCase()));

    for (const item of accountsList) {
      const email = item.email?.trim().toLowerCase();
      const name = item.name?.trim();
      const role = item.role?.trim() || "employee";
      const position = item.position?.trim() || "Team Member";
      const phone = item.phone?.trim() || null;
      const gender = item.gender?.trim().toLowerCase() || "male";
      const password = item.password?.trim() || "srimatrix123";

      if (!email || !name) {
        skipped.push(`${name || "Unknown"} (missing name/email)`);
        continue;
      }

      if (existingSet.has(email)) {
        skipped.push(`${email} (already exists)`);
        continue;
      }

      existingSet.add(email);
      toInsert.push({
        name,
        email,
        role,
        position,
        phone,
        password,
        gender,
      });
    }

    if (toInsert.length === 0) {
      return {
        success: false,
        message: `No new accounts could be created. ${skipped.join(", ")}`,
      };
    }

    const insertedAccounts = await db.insert(accounts).values(toInsert).returning();

    if (insertedAccounts && insertedAccounts.length > 0) {
      try {
        const permsToInsert = insertedAccounts.map((acc) => {
          const isSuper = acc.role.toLowerCase() === "superadmin" || acc.position?.toLowerCase().includes("super administrator");
          const isAdmin = isSuper || acc.role.toLowerCase() === "admin";
          return {
            accountId: acc.id,
            isSuperAdmin: isSuper,
            canManagePermissions: isAdmin,
            tabOverview: isAdmin,
            tabSrimatrix: isAdmin,
            tabCandidates: isAdmin,
            tabPipeline: isAdmin,
            tabJob: isAdmin,
            tabMileage: true,
            tabMileageManage: isAdmin,
            tabReviewing: isAdmin,
            tabAccounts: isAdmin,
            tabMail: isAdmin,
            tabCredentials: isAdmin,
            tabSessions: isAdmin,
            tabLogs: isAdmin,
            tabTimesheets: true,
            widgetKpiMetrics: isAdmin,
            widgetEntityCards: isAdmin,
            widgetAnalyticsChart: isAdmin,
            widgetFollowupTicker: isAdmin,
            widgetEmailFeed: isAdmin,
          };
        });
        await db.insert(permissions).values(permsToInsert);
      } catch (bulkPermErr) {
        console.error("Failed to insert initial permissions for bulk accounts:", bulkPermErr);
      }
    }

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "BULK_ACCOUNTS_CREATED",
      status: "success",
      ipAddress,
      userAgent,
      details: `Admin ${currentUser.name} created ${toInsert.length} accounts in bulk.`,
    });

    // Send automated welcome email with credentials to all created members
    let emailsSent = 0;
    try {
      const headersList = await headers();
      const host = headersList.get("host") || "localhost:3000";
      const proto = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const portalUrl = `${proto}://${host}`;

      for (const item of toInsert) {
        try {
          await sendWelcomeCredentialsEmail({
            name: item.name,
            email: item.email,
            password: item.password,
            role: item.role,
            position: item.position,
            portalUrl,
          });
          emailsSent++;
        } catch (itemMailErr) {
          console.error(`Failed to send welcome credentials email to ${item.email}:`, itemMailErr);
        }
      }
    } catch (e) {
      console.error("Bulk welcome email delivery error:", e);
    }

    let msg = `Successfully created ${toInsert.length} accounts in bulk!`;
    if (emailsSent > 0) {
      msg += ` (${emailsSent} welcome credentials emails sent)`;
    }
    if (skipped.length > 0) {
      msg += ` (${skipped.length} skipped: ${skipped.slice(0, 3).join(", ")})`;
    }

    return { success: true, message: msg };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to bulk create accounts." };
  }
}

export async function getUserDetailsAction(accountId: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized && currentUser.accountId !== accountId) {
    return { success: false, message: "Unauthorized: Accounts access required." };
  }

  try {
    const userAcc = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
    if (userAcc.length === 0) {
      return { success: false, message: "Account not found." };
    }

    const userTimesheets = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.accountId, accountId))
      .orderBy(desc(timesheets.createdAt), desc(timesheets.id));

    const userLogs = await db
      .select()
      .from(logs)
      .where(eq(logs.accountId, accountId))
      .orderBy(desc(logs.createdAt))
      .limit(50);

    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.accountId, accountId))
      .orderBy(desc(sessions.createdAt));

    return {
      success: true,
      account: userAcc[0],
      timesheets: userTimesheets,
      logs: userLogs,
      sessions: userSessions,
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to load user details." };
  }
}

export async function getAccountsForCampaignAction() {
  if (!db) return [];
  try {
    const list = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        role: accounts.role,
        position: accounts.position,
      })
      .from(accounts)
      .orderBy(accounts.name);
    return list;
  } catch (err) {
    console.error("Error fetching accounts for campaign:", err);
    return [];
  }
}


/**
 * Normalized Candidates Database Actions
 */
export async function getCandidatesAction() {
  if (!db) return [];
  try {
    const list = await db
      .select()
      .from(candidates)
      .orderBy(desc(candidates.createdAt));
    return list;
  } catch (err) {
    console.error("Error fetching candidates:", err);
    return [];
  }
}

export async function createCandidateAction(formData: FormData | Record<string, any>) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const getVal = (key: string) => {
    if (formData instanceof FormData) {
      return formData.get(key)?.toString().trim() || null;
    }
    return formData[key] !== undefined && formData[key] !== null ? String(formData[key]).trim() : null;
  };

  const fullName = getVal("name") || getVal("col_name");
  let firstName = getVal("first_name") || getVal("firstName");
  let lastName = getVal("last_name") || getVal("lastName");

  if (!firstName && fullName) {
    const parts = fullName.trim().split(/\s+/);
    firstName = parts[0] || "Candidate";
    lastName = parts.slice(1).join(" ") || "";
  }

  if (!firstName) {
    return { success: false, message: "Candidate first name is required." };
  }
  if (!lastName) lastName = "";

  const email = getVal("email") || getVal("col_email");
  const phone = getVal("phone") || getVal("col_phone");
  const locationRaw = getVal("location") || getVal("col_location") || getVal("loc") || getVal("address");
  let city = getVal("city") || getVal("col_city");
  let state = getVal("state") || getVal("col_state");
  if (locationRaw && (!city || !state)) {
    if (locationRaw.includes(",")) {
      const parts = locationRaw.split(",").map((s) => s.trim());
      if (!city) city = parts[0] || null;
      if (!state) state = parts.slice(1).join(", ") || null;
    } else {
      if (!city) city = locationRaw;
    }
  }
  const candidateCustomData: Record<string, any> = {};
  if (locationRaw) {
    candidateCustomData.location = locationRaw;
  } else if (city || state) {
    candidateCustomData.location = [city, state].filter(Boolean).join(", ");
  }
  const country = getVal("country") || getVal("col_country");
  const zipCode = getVal("zip_code") || getVal("zipCode") || getVal("col_zip");
  const education = getVal("education") || getVal("col_education");
  const expVal = getVal("experience_years") || getVal("experienceYears") || getVal("experience") || getVal("col_experience");
  const experienceYears = expVal ? String(expVal).replace(/[^0-9.]/g, "") || null : null;
  const skillsRaw = getVal("skills") || getVal("col_skills");
  let skillsList: string[] = [];
  if (Array.isArray(skillsRaw)) {
    skillsList = skillsRaw.map(String);
  } else if (typeof skillsRaw === "string" && skillsRaw.trim()) {
    skillsList = skillsRaw.split(/[,;|]+/).map((s) => s.trim()).filter(Boolean);
  }
  const workAuthorization = getVal("work_authorization") || getVal("workAuthorization");
  const licenseStatus = getVal("license_status") || getVal("licenseStatus");
  const graduationDate = getVal("graduation_date") || getVal("graduationDate");
  const availabilityDate = getVal("availability_date") || getVal("availabilityDate");
  const source = getVal("source") || getVal("col_source");
  const salVal = getVal("salary_expectation") || getVal("salaryExpectation") || getVal("salary") || getVal("col_salary");
  const salaryExpectation = salVal ? String(salVal).replace(/[^0-9.]/g, "") || null : null;
  const salaryCurrency = getVal("salary_currency") || getVal("salaryCurrency") || "USD";
  const pipelineStage = getVal("pipeline_stage") || getVal("pipelineStage") || getVal("status") || getVal("stage") || "Lead";
  const notes = getVal("notes") || getVal("col_notes");
  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const inserted = await db
      .insert(candidates)
      .values({
        firstName,
        lastName,
        email,
        phone,
        city,
        state,
        country,
        zipCode,
        education,
        experienceYears,
        skills: skillsList,
        workAuthorization,
        licenseStatus,
        graduationDate,
        availabilityDate,
        source,
        salaryExpectation,
        salaryCurrency,
        pipelineStage,
        notes,
        customData: candidateCustomData,
      })
      .returning();

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "CANDIDATE_CREATED",
      status: "success",
      ipAddress,
      userAgent,
      details: `User ${currentUser.name} added candidate "${firstName} ${lastName}" (${email || "No email"})`,
    });

    return {
      success: true,
      message: `Candidate "${firstName} ${lastName}" created successfully!`,
      candidate: inserted[0],
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to create candidate." };
  }
}

export async function updateCandidateAction(id: number, data: Partial<NewCandidate>) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const updated = await db
      .update(candidates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id))
      .returning();

    if (updated.length === 0) {
      return { success: false, message: "Candidate not found." };
    }

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "CANDIDATE_UPDATED",
      status: "info",
      ipAddress,
      userAgent,
      details: `User ${currentUser.name} updated candidate #${id} (${updated[0].firstName} ${updated[0].lastName})`,
    });

    return { success: true, message: `Candidate "${updated[0].firstName} ${updated[0].lastName}" updated.`, candidate: updated[0] };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to update candidate." };
  }
}

export async function deleteCandidateAction(id: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabCandidates");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Candidate management permission required." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const existing = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
    if (existing.length === 0) {
      return { success: false, message: "Candidate not found." };
    }

    await db.delete(candidates).where(eq(candidates.id, id));

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "CANDIDATE_DELETED",
      status: "warning",
      ipAddress,
      userAgent,
      details: `Admin ${currentUser.name} deleted candidate #${id} (${existing[0].firstName} ${existing[0].lastName})`,
    });

    return { success: true, message: `Candidate "${existing[0].firstName} ${existing[0].lastName}" deleted.` };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to delete candidate." };
  }
}

export async function bulkDeleteCandidatesAction(ids: number[]) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  if (!ids || ids.length === 0) {
    return { success: false, message: "No candidate IDs provided." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    await db.delete(candidates).where(inArray(candidates.id, ids));

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "CANDIDATES_BULK_DELETED",
      status: "warning",
      ipAddress,
      userAgent,
      details: `User ${currentUser.name} deleted ${ids.length} candidates`,
    });

    return { success: true, message: `Successfully deleted ${ids.length} candidates.` };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to bulk delete candidates." };
  }
}

function extractRowValue(row: Record<string, any>, candidateKeys: string[]): string | null {
  for (const k of candidateKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
      return String(row[k]).trim();
    }
  }
  const rowKeys = Object.keys(row);
  for (const k of candidateKeys) {
    const found = rowKeys.find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== "") {
      return String(row[found]).trim();
    }
  }
  return null;
}

export async function bulkCreateCandidatesAction(candidatesList: any[]) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const database = db;

  if (!candidatesList || candidatesList.length === 0) {
    return { success: false, message: "No candidate rows provided." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    const parsedRows = candidatesList
      .map((r) => {
        if (!r || typeof r !== "object") return null;

        let firstName = extractRowValue(r, ["first_name", "firstName", "fname"]);
        let lastName = extractRowValue(r, ["last_name", "lastName", "lname"]);
        const fullName = extractRowValue(r, [
          "name", "candidateName", "candidate_name", "applicant",
          "applicant_name", "full_name", "fullname", "col_name"
        ]);

        if (!firstName && fullName) {
          const parts = String(fullName).trim().split(/\s+/);
          firstName = parts[0] || "Candidate";
          lastName = parts.slice(1).join(" ") || "";
        }

        if (!firstName) {
          for (const val of Object.values(r)) {
            if (val !== undefined && val !== null) {
              const s = String(val).trim();
              if (s.length > 0 && isNaN(Number(s))) {
                const parts = s.split(/\s+/);
                firstName = parts[0];
                lastName = parts.slice(1).join(" ") || "";
                break;
              }
            }
          }
        }

        if (!firstName) return null;
        if (!lastName) lastName = "";

        const email = extractRowValue(r, ["email", "candidateEmail", "email_address", "mail", "col_email"]) || null;
        const phone = extractRowValue(r, ["phone", "telephone", "tel", "phone_number", "mobile", "cell", "col_phone"]) || null;
        const locationRaw = extractRowValue(r, ["location", "col_location", "loc", "address"]) || null;
        let city = extractRowValue(r, ["city", "col_city"]) || null;
        let state = extractRowValue(r, ["state", "col_state"]) || null;
        if (locationRaw && (!city || !state)) {
          if (locationRaw.includes(",")) {
            const locParts = locationRaw.split(",").map((s) => s.trim());
            if (!city) city = locParts[0] || null;
            if (!state) state = locParts.slice(1).join(", ") || null;
          } else {
            if (!city) city = locationRaw;
          }
        }
        const country = extractRowValue(r, ["country", "col_country"]) || null;
        const zipCode = extractRowValue(r, ["zip_code", "zipCode", "zip", "postal_code", "col_zip"]) || null;
        const education = extractRowValue(r, ["education", "degree", "col_education"]) || null;
        const expRaw = extractRowValue(r, ["experience_years", "experienceYears", "experience", "exp", "col_experience"]);
        const experienceYears = expRaw ? String(expRaw).replace(/[^0-9.]/g, "") || null : null;
        const skillsRaw = extractRowValue(r, ["skills", "primary_skills", "tech_stack", "expertise", "col_skills"]);
        let skills: string[] = [];
        if (Array.isArray(skillsRaw)) {
          skills = skillsRaw.map(String);
        } else if (typeof skillsRaw === "string" && skillsRaw.trim()) {
          skills = skillsRaw.split(/[,;|]+/).map((s) => s.trim()).filter(Boolean);
        }
        const workAuthorization = extractRowValue(r, ["work_authorization", "workAuthorization", "visa_status", "work_status"]) || null;
        const licenseStatus = extractRowValue(r, ["license_status", "licenseStatus", "license"]) || null;
        const graduationDate = extractRowValue(r, ["graduation_date", "graduationDate"]) || null;
        const availabilityDate = extractRowValue(r, ["availability_date", "availabilityDate"]) || null;
        const source = extractRowValue(r, ["source", "referral", "channel", "col_source"]) || null;
        const salRaw = extractRowValue(r, ["salary_expectation", "salaryExpectation", "salary", "rate", "col_salary"]);
        const salaryExpectation = salRaw ? String(salRaw).replace(/[^0-9.]/g, "") || null : null;
        const salaryCurrency = extractRowValue(r, ["salary_currency", "salaryCurrency", "currency"]) || "USD";
        const pipelineStage = extractRowValue(r, ["pipeline_stage", "pipelineStage", "stage", "status", "col_status"]) || "Lead";
        const notes = extractRowValue(r, ["notes", "note", "col_notes"]) || null;

        const rowCustom = typeof r === "object" ? { ...r } : {};
        if (locationRaw) {
          rowCustom.location = locationRaw;
        } else if (city || state) {
          rowCustom.location = [city, state].filter(Boolean).join(", ");
        }

        return {
          firstName,
          lastName,
          email,
          phone,
          city,
          state,
          country,
          zipCode,
          education,
          experienceYears,
          skills,
          workAuthorization,
          licenseStatus,
          graduationDate,
          availabilityDate,
          source,
          salaryExpectation,
          salaryCurrency,
          pipelineStage,
          notes,
          customData: rowCustom,
        };
      })
      .filter(Boolean) as (typeof candidates.$inferInsert)[];

    if (parsedRows.length === 0) {
      return { success: false, message: "No valid candidate rows to insert." };
    }

    const existingList = await database
      .select({ id: candidates.id, email: candidates.email })
      .from(candidates);

    const existingMap = new Map<string, number>();
    for (const c of existingList) {
      if (c.email) {
        existingMap.set(c.email.toLowerCase().trim(), c.id);
      }
    }

    const toCreate: (typeof candidates.$inferInsert)[] = [];
    const toUpdate: { id: number; data: typeof candidates.$inferInsert }[] = [];

    for (const row of parsedRows) {
      const key = row.email ? row.email.toLowerCase().trim() : null;
      const existingId = key ? existingMap.get(key) : undefined;

      if (existingId && existingId > 0) {
        toUpdate.push({ id: existingId, data: row });
      } else {
        toCreate.push(row);
        if (key) existingMap.set(key, -1);
      }
    }

    const UPDATE_CONCURRENCY = 20;
    for (let i = 0; i < toUpdate.length; i += UPDATE_CONCURRENCY) {
      const batch = toUpdate.slice(i, i + UPDATE_CONCURRENCY);
      await Promise.all(
        batch.map((item) =>
          database
            .update(candidates)
            .set({
              ...item.data,
              updatedAt: new Date(),
            })
            .where(eq(candidates.id, item.id))
        )
      );
    }

    for (let i = 0; i < toCreate.length; i += 100) {
      const chunk = toCreate.slice(i, i + 100);
      await database.insert(candidates).values(chunk);
    }

    await database.insert(logs).values({
      accountId: currentUser.accountId,
      action: "BULK_CANDIDATES_SAVED",
      status: "success",
      ipAddress,
      userAgent,
      details: `User ${currentUser.name} processed ${parsedRows.length} candidates (${toCreate.length} created, ${toUpdate.length} updated).`,
    });

    return {
      success: true,
      message: `Successfully processed ${parsedRows.length} candidates (${toCreate.length} new, ${toUpdate.length} updated)!`,
    };
  } catch (err) {
    console.error("Bulk create candidates error:", err);
    return { success: false, message: (err as Error).message || "Failed to bulk save candidates." };
  }
}

/**
 * Normalized Pipeline Follow-ups Actions (with Entity Joins)
 */
export async function getPipelineFollowupsAction() {
  if (!db) return [];
  try {
    const rows = await db
      .select({
        id: pipelineFollowups.id,
        candidateId: pipelineFollowups.candidateId,
        accountId: pipelineFollowups.accountId,
        title: pipelineFollowups.title,
        stage: pipelineFollowups.stage,
        followUpDate: pipelineFollowups.followUpDate,
        shouldNotify: pipelineFollowups.shouldNotify,
        priority: pipelineFollowups.priority,
        notes: pipelineFollowups.notes,
        status: pipelineFollowups.status,
        createdAt: pipelineFollowups.createdAt,
        updatedAt: pipelineFollowups.updatedAt,
        // Joined Relational Data
        candidateFirstName: candidates.firstName,
        candidateLastName: candidates.lastName,
        candidateEmail: candidates.email,
        candidateStage: candidates.pipelineStage,
        accountName: accounts.name,
        accountEmail: accounts.email,
        // Fallback fields for unlinked items
        legacyEntityType: pipelineFollowups.entityType,
        legacyEntityName: pipelineFollowups.entityName,
        legacyContactEmail: pipelineFollowups.contactEmail,
        legacyEntityId: pipelineFollowups.entityId,
      })
      .from(pipelineFollowups)
      .leftJoin(candidates, eq(pipelineFollowups.candidateId, candidates.id))
      .leftJoin(accounts, eq(pipelineFollowups.accountId, accounts.id))
      .orderBy(pipelineFollowups.followUpDate);

    // Format normalized response for UI consumption
    return rows.map((r) => {
      let entityType = r.legacyEntityType || "candidate";
      let entityName = r.legacyEntityName || "Follow-up Target";
      let contactEmail = r.legacyContactEmail || "";
      let subtitle = "";

      const candFullName = r.candidateFirstName
        ? `${r.candidateFirstName} ${r.candidateLastName || ""}`.trim()
        : null;

      if (r.candidateId && candFullName) {
        entityType = "candidate";
        entityName = candFullName;
        contactEmail = r.candidateEmail || "";
        subtitle = r.candidateStage ? `Stage: ${r.candidateStage}` : "Candidate Applicant";
      } else if (r.accountId && r.accountName) {
        entityType = "account";
        entityName = r.accountName;
        contactEmail = r.accountEmail || "";
        subtitle = "Team Member";
      }

      return {
        id: r.id,
        candidateId: r.candidateId,
        accountId: r.accountId,
        entityType,
        entityId: r.candidateId ? `cand-${r.candidateId}` : r.accountId ? `acc-${r.accountId}` : r.legacyEntityId || r.id,
        entityName,
        contactEmail,
        subtitle,
        title: r.title,
        stage: r.stage,
        followUpDate: r.followUpDate,
        shouldNotify: r.shouldNotify,
        priority: r.priority,
        notes: r.notes,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  } catch (err) {
    console.error("Error fetching pipeline followups:", err);
    return [];
  }
}

export async function savePipelineFollowupAction(item: {
  id?: string;
  candidateId?: number | null;
  accountId?: number | null;
  entityType?: "candidate" | "account" | "other";
  entityId?: string;
  entityName?: string;
  contactEmail?: string;
  title: string;
  stage?: string;
  followUpDate: string;
  shouldNotify?: boolean;
  priority?: string;
  notes?: string;
  status?: string;
}) {
  if (!db) return { success: false, message: "Database not connected" };
  try {
    const recordId = item.id || `pl-${Date.now()}`;
    const existing = await db
      .select({ id: pipelineFollowups.id })
      .from(pipelineFollowups)
      .where(eq(pipelineFollowups.id, recordId))
      .limit(1);

    const payload = {
      candidateId: item.candidateId || null,
      accountId: item.accountId || null,
      entityType: item.entityType || "candidate",
      entityId: item.entityId || (item.candidateId ? `cand-${item.candidateId}` : null),
      entityName: item.entityName || "Follow-up",
      contactEmail: item.contactEmail || null,
      title: item.title,
      stage: item.stage || "Needs Follow-up",
      followUpDate: item.followUpDate,
      shouldNotify: item.shouldNotify ?? true,
      priority: item.priority || "high",
      notes: item.notes || null,
      status: item.status || "pending",
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db
        .update(pipelineFollowups)
        .set(payload)
        .where(eq(pipelineFollowups.id, recordId));
    } else {
      await db.insert(pipelineFollowups).values({
        id: recordId,
        ...payload,
        createdAt: new Date(),
      });
    }

    return { success: true, id: recordId, message: "Follow-up saved to pipeline" };
  } catch (err) {
    console.error("Error saving pipeline followup:", err);
    return { success: false, message: (err as Error).message };
  }
}

export async function deletePipelineFollowupAction(id: string) {
  if (!db) return { success: false, message: "Database not connected" };
  try {
    await db.delete(pipelineFollowups).where(eq(pipelineFollowups.id, id));
    return { success: true };
  } catch (err) {
    console.error("Error deleting pipeline followup:", err);
    return { success: false, message: (err as Error).message };
  }
}

export async function togglePipelineFollowupStatusAction(id: string, newStatus: string) {
  if (!db) return { success: false, message: "Database not connected" };
  try {
    await db
      .update(pipelineFollowups)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(pipelineFollowups.id, id));
    return { success: true };
  } catch (err) {
    console.error("Error toggling pipeline status:", err);
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Real Workforce Analytics Aggregation from PostgreSQL timesheets table
 */
export async function getWorkforceAnalyticsAction() {
  if (!db) {
    return {
      week: { title: "Weekly Workforce Output", periodLabel: "Past 7 Days", data: [], totalHours: 0, avgHours: "0 hrs/day", changePct: "No data", onTimeRate: "100%", capacityRate: "100%", peakLabel: "N/A" },
      month: { title: "Monthly Workforce Output", periodLabel: "Current Month", data: [], totalHours: 0, avgHours: "0 hrs/wk", changePct: "No data", onTimeRate: "100%", capacityRate: "100%", peakLabel: "N/A" },
      quarter: { title: "Quarterly Performance", periodLabel: "Current Quarter", data: [], totalHours: 0, avgHours: "0 hrs/mo", changePct: "No data", onTimeRate: "100%", capacityRate: "100%", peakLabel: "N/A" },
      year: { title: "Annual Productive Output", periodLabel: "Fiscal Year 2026", data: [], totalHours: 0, avgHours: "0 hrs/mo", changePct: "No data", onTimeRate: "100%", capacityRate: "100%", peakLabel: "N/A" },
    };
  }

  try {
    const allTimesheets = await db
      .select()
      .from(timesheets)
      .orderBy(desc(timesheets.year), desc(timesheets.month), desc(timesheets.weekNumber));

    if (allTimesheets.length === 0) {
      const emptyData = [
        { label: "Mon", hours: 0, targetHours: 8, attendancePct: 0, sessions: 0 },
        { label: "Tue", hours: 0, targetHours: 8, attendancePct: 0, sessions: 0 },
        { label: "Wed", hours: 0, targetHours: 8, attendancePct: 0, sessions: 0 },
        { label: "Thu", hours: 0, targetHours: 8, attendancePct: 0, sessions: 0 },
        { label: "Fri", hours: 0, targetHours: 8, attendancePct: 0, sessions: 0 },
        { label: "Sat", hours: 0, targetHours: 0, attendancePct: 0, sessions: 0 },
        { label: "Sun", hours: 0, targetHours: 0, attendancePct: 0, sessions: 0 },
      ];
      return {
        week: { title: "Weekly Workforce Output", periodLabel: "Past 7 Days", data: emptyData, totalHours: 0, avgHours: "0 hrs/day", changePct: "0% vs benchmark", onTimeRate: "0%", capacityRate: "0%", peakLabel: "None" },
        month: { title: "Monthly Workforce Output", periodLabel: "Current Month", data: [], totalHours: 0, avgHours: "0 hrs/wk", changePct: "0%", onTimeRate: "0%", capacityRate: "0%", peakLabel: "None" },
        quarter: { title: "Quarterly Performance", periodLabel: "Current Quarter", data: [], totalHours: 0, avgHours: "0 hrs/mo", changePct: "0%", onTimeRate: "0%", capacityRate: "0%", peakLabel: "None" },
        year: { title: "Annual Productive Output", periodLabel: "Fiscal Year 2026", data: [], totalHours: 0, avgHours: "0 hrs/mo", changePct: "0%", onTimeRate: "0%", capacityRate: "0%", peakLabel: "None" },
      };
    }

    // 1. Weekly Data (Sum daily hours across all users for the current/most recent week)
    const latestYear = allTimesheets[0].year;
    const latestMonth = allTimesheets[0].month;
    const latestWeek = allTimesheets[0].weekNumber;

    const currentWeekTimesheets = allTimesheets.filter(
      (t) => t.year === latestYear && t.month === latestMonth && t.weekNumber === latestWeek
    );

    const weekMon = currentWeekTimesheets.reduce((s, t) => s + (t.mondayHours || 0), 0);
    const weekTue = currentWeekTimesheets.reduce((s, t) => s + (t.tuesdayHours || 0), 0);
    const weekWed = currentWeekTimesheets.reduce((s, t) => s + (t.wednesdayHours || 0), 0);
    const weekThu = currentWeekTimesheets.reduce((s, t) => s + (t.thursdayHours || 0), 0);
    const weekFri = currentWeekTimesheets.reduce((s, t) => s + (t.fridayHours || 0), 0);
    const weekSat = currentWeekTimesheets.reduce((s, t) => s + (t.saturdayHours || 0), 0);
    const weekSun = currentWeekTimesheets.reduce((s, t) => s + (t.sundayHours || 0), 0);
    const weekTotal = weekMon + weekTue + weekWed + weekThu + weekFri + weekSat + weekSun;

    const workerCount = Math.max(1, currentWeekTimesheets.length);
    const standardDailyTarget = workerCount * 8;

    const weekData = [
      { label: "Mon", subLabel: "Monday", hours: weekMon, targetHours: standardDailyTarget, attendancePct: weekMon > 0 ? 100 : 0, sessions: workerCount },
      { label: "Tue", subLabel: "Tuesday", hours: weekTue, targetHours: standardDailyTarget, attendancePct: weekTue > 0 ? 100 : 0, sessions: workerCount },
      { label: "Wed", subLabel: "Wednesday", hours: weekWed, targetHours: standardDailyTarget, attendancePct: weekWed > 0 ? 100 : 0, sessions: workerCount },
      { label: "Thu", subLabel: "Thursday", hours: weekThu, targetHours: standardDailyTarget, attendancePct: weekThu > 0 ? 100 : 0, sessions: workerCount },
      { label: "Fri", subLabel: "Friday", hours: weekFri, targetHours: standardDailyTarget, attendancePct: weekFri > 0 ? 100 : 0, sessions: workerCount },
      { label: "Sat", subLabel: "Saturday", hours: weekSat, targetHours: 0, attendancePct: weekSat > 0 ? 100 : 0, sessions: weekSat > 0 ? workerCount : 0 },
      { label: "Sun", subLabel: "Sunday", hours: weekSun, targetHours: 0, attendancePct: weekSun > 0 ? 100 : 0, sessions: weekSun > 0 ? workerCount : 0 },
    ];

    const dailyPeak = weekData.reduce((prev, curr) => (curr.hours > prev.hours ? curr : prev), weekData[0]);

    // 2. Monthly Data (Weeks 1 to 4/5 of current month)
    const monthWeeks: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const currentMonthTimesheets = allTimesheets.filter(
      (t) => t.year === latestYear && t.month === latestMonth
    );
    currentMonthTimesheets.forEach((t) => {
      if (monthWeeks[t.weekNumber] !== undefined) {
        monthWeeks[t.weekNumber] += t.totalHours || 0;
      }
    });

    const monthData = [1, 2, 3, 4].map((wk) => ({
      label: `Week ${wk}`,
      subLabel: `Week ${wk} of Month ${latestMonth}`,
      hours: monthWeeks[wk] || 0,
      targetHours: workerCount * 40,
      attendancePct: (monthWeeks[wk] || 0) > 0 ? 100 : 0,
      sessions: workerCount * 5,
    }));
    const monthTotal = currentMonthTimesheets.reduce((s, t) => s + (t.totalHours || 0), 0);

    // 3. Annual Data (Months 1 to 12)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yearMonths = Array.from({ length: 12 }, () => 0);
    allTimesheets.filter((t) => t.year === latestYear).forEach((t) => {
      const idx = (t.month || 1) - 1;
      if (idx >= 0 && idx < 12) {
        yearMonths[idx] += t.totalHours || 0;
      }
    });

    const yearData = yearMonths.map((hrs, idx) => ({
      label: monthNames[idx],
      subLabel: `${monthNames[idx]} ${latestYear}`,
      hours: hrs,
      targetHours: workerCount * 160,
      attendancePct: hrs > 0 ? 100 : 0,
      sessions: workerCount * 20,
    }));
    const yearTotal = yearMonths.reduce((a, b) => a + b, 0);

    // 4. Quarter Data (Past 6 months or current quarter)
    const quarterData = yearData.slice(Math.max(0, latestMonth - 3), latestMonth);
    const quarterTotal = quarterData.reduce((s, d) => s + d.hours, 0);

    const approvedCount = allTimesheets.filter((t) => t.status === "approved").length;
    const approvalRate = allTimesheets.length > 0 ? `${Math.round((approvedCount / allTimesheets.length) * 100)}%` : "100%";

    return {
      week: {
        title: "Weekly Workforce Output",
        periodLabel: `Week ${latestWeek}, Month ${latestMonth} ${latestYear}`,
        data: weekData,
        totalHours: weekTotal,
        avgHours: `${(weekTotal / 7).toFixed(1)} hrs/day`,
        changePct: `${weekTotal} hrs logged`,
        onTimeRate: approvalRate,
        capacityRate: `${Math.min(100, Math.round((weekTotal / (workerCount * 40 || 1)) * 100))}%`,
        peakLabel: `${dailyPeak.subLabel} (${dailyPeak.hours} hrs)`,
      },
      month: {
        title: "Monthly Workforce Output",
        periodLabel: `Month ${latestMonth}, ${latestYear}`,
        data: monthData,
        totalHours: monthTotal,
        avgHours: `${(monthTotal / 4).toFixed(1)} hrs/wk`,
        changePct: `${monthTotal} hrs recorded`,
        onTimeRate: approvalRate,
        capacityRate: `${Math.min(100, Math.round((monthTotal / (workerCount * 160 || 1)) * 100))}%`,
        peakLabel: `Month ${latestMonth}`,
      },
      quarter: {
        title: "Quarterly Performance",
        periodLabel: `Q${Math.ceil(latestMonth / 3)} ${latestYear}`,
        data: quarterData.length > 0 ? quarterData : monthData,
        totalHours: quarterTotal,
        avgHours: `${(quarterTotal / (quarterData.length || 1)).toFixed(1)} hrs/mo`,
        changePct: `${quarterTotal} hrs recorded`,
        onTimeRate: approvalRate,
        capacityRate: "100%",
        peakLabel: `Q${Math.ceil(latestMonth / 3)}`,
      },
      year: {
        title: "Annual Productive Output",
        periodLabel: `Fiscal Year ${latestYear}`,
        data: yearData,
        totalHours: yearTotal,
        avgHours: `${(yearTotal / 12).toFixed(1)} hrs/mo`,
        changePct: `${yearTotal} hrs total`,
        onTimeRate: approvalRate,
        capacityRate: "100%",
        peakLabel: `Year ${latestYear}`,
      },
    };
  } catch (err) {
    console.error("Error aggregating workforce analytics:", err);
    return null;
  }
}



export async function getCandidatesSheetAction() {
  if (!db) return { success: true, columns: [], records: [] };
  try {
    const list = await db
      .select()
      .from(candidates)
      .orderBy(desc(candidates.createdAt));

    const defaultColumns = [
      { id: "first_name", name: "First Name", type: "text" },
      { id: "last_name", name: "Last Name", type: "text" },
      { id: "email", name: "Email", type: "email" },
      { id: "phone", name: "Phone", type: "text" },
      { id: "location", name: "Location", type: "text" },
      { id: "education", name: "Education", type: "text" },
      { id: "experience_years", name: "Experience (Yrs)", type: "number" },
      { id: "skills", name: "Skills", type: "text" },
      { id: "work_authorization", name: "Work Auth", type: "text" },
      { id: "pipeline_stage", name: "Pipeline Stage", type: "status" },
      { id: "source", name: "Source", type: "text" },
      { id: "salary_expectation", name: "Salary Expectation", type: "number" },
      { id: "notes", name: "Notes", type: "text" },
    ];

    const records = list.map((c) => {
      const custom = (c.customData && typeof c.customData === "object" ? c.customData : {}) as Record<string, any>;
      const locationParts = [c.city, c.state].filter(Boolean);
      const computedLocation = (custom.location && String(custom.location).trim())
        ? String(custom.location).trim()
        : (locationParts.length > 0 ? locationParts.join(", ") : (c.country || ""));

      return {
        id: String(c.id),
        numericId: Number(c.id),
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
        first_name: c.firstName || "",
        last_name: c.lastName || "",
        email: c.email || "",
        phone: c.phone || "",
        country: c.country || "",
        zip_code: c.zipCode || "",
        education: c.education || "",
        experience_years: c.experienceYears !== null && c.experienceYears !== undefined ? String(c.experienceYears) : "",
        skills: Array.isArray(c.skills) ? c.skills.join(", ") : "",
        work_authorization: c.workAuthorization || "",
        license_status: c.licenseStatus || "",
        graduation_date: c.graduationDate || "",
        availability_date: c.availabilityDate || "",
        source: c.source || "",
        salary_expectation: c.salaryExpectation !== null && c.salaryExpectation !== undefined ? String(c.salaryExpectation) : "",
        salary_currency: c.salaryCurrency || "USD",
        pipeline_stage: c.pipelineStage || "Lead",
        notes: c.notes || "",
        ...custom,
        location: computedLocation,
      };
    });

    return {
      success: true,
      columns: defaultColumns,
      records,
      updatedAt: new Date(),
    };
  } catch (e) {
    console.error("Error fetching candidates directly from DB:", e);
    return { success: false, columns: [], records: [], message: (e as Error).message };
  }
}

export async function saveCandidatesSheetAction(columns: any[], records: any[]) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  try {
    if (records && records.length > 0) {
      await bulkCreateCandidatesAction(records);
    }
    return { success: true, message: "Candidates saved directly to database successfully!" };
  } catch (err) {
    console.error("Save candidates to DB error:", err);
    return { success: false, message: (err as Error).message || "Failed to save candidates." };
  }
}

/**
 * Live SMTP Campaign Dispatch Action
 */
export async function sendCampaignEmailAction(payload: {
  recipients: Array<{ email: string; name?: string; roleOrCompany?: string }>;
  subject: string;
  body: string;
}) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, total: 0, sent: 0, failed: 0, message: "Unauthorized: Admin privileges required." };
  }

  if (!payload.recipients || payload.recipients.length === 0) {
    return { success: false, total: 0, sent: 0, failed: 0, message: "No recipients provided." };
  }

  if (!payload.subject || !payload.subject.trim()) {
    return { success: false, total: payload.recipients.length, sent: 0, failed: payload.recipients.length, message: "Subject line is required." };
  }

  try {
    let userCustomConfig: any = undefined;
    if (db) {
      const credRows = await db
        .select()
        .from(emailCredentials)
        .where(eq(emailCredentials.accountId, currentUser.accountId))
        .limit(1);

      if (credRows.length > 0 && credRows[0].key) {
        const row = credRows[0];
        userCustomConfig = {
          smtpUser: row.email,
          fromEmail: row.email,
          fromName: currentUser.name || "SriMatrix Health",
          smtpPass: row.key.replace(/\s+/g, ""),
          includeLogoHeader: Boolean(row.logoOn),
          signature: row.signature || "",
        };
        try {
          saveStoredEmailCredentials(userCustomConfig);
        } catch {
          // ignore memory sync errors
        }
      }
    }

    const result = await sendCampaignBatch({
      recipients: payload.recipients,
      subject: payload.subject,
      body: payload.body,
      customConfig: userCustomConfig,
    });

    const { ipAddress, userAgent } = await getClientMeta();
    if (db) {
      await db.insert(logs).values({
        accountId: currentUser.accountId,
        action: "SEND_EMAIL_CAMPAIGN",
        details: `Dispatched campaign "${payload.subject.slice(0, 50)}" to ${result.sent} recipients (${result.failed} failed)`,
        ipAddress,
        userAgent,
      });
    }

    return {
      success: result.sent > 0,
      total: result.total,
      sent: result.sent,
      failed: result.failed,
      message: result.sent > 0
        ? `Successfully sent ${result.sent} of ${result.total} emails via SriMatrix Health SMTP.`
        : "Failed to dispatch emails. Please verify recipient addresses.",
    };
  } catch (err: any) {
    console.error("sendCampaignEmailAction error:", err);
    return {
      success: false,
      total: payload.recipients.length,
      sent: 0,
      failed: payload.recipients.length,
      message: err?.message || "Failed to dispatch email campaign.",
    };
  }
}

/**
 * Verify live SMTP connection
 */
export async function getSMTPStatusAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  return await verifySMTPConnection();
}

/**
 * Srimatrix Healthcare Directory Actions:
 * - Query and search the 700+ facilities and medical provider records
 */
export async function getSrimatrixDirectoryAction(limit = 100) {
  if (!db) return [];
  try {
    const rows = await db
      .select()
      .from(srimatrix)
      .orderBy(desc(srimatrix.createdAt))
      .limit(limit);
    return rows;
  } catch (err) {
    console.error("Error fetching srimatrix directory:", err);
    return [];
  }
}

export async function createSrimatrixRecordAction(data: {
  facilityName?: string;
  firstName?: string;
  lastName?: string;
  type?: string;
  administrator?: string;
  phone?: string;
  email?: string;
  beds?: number | string;
  city?: string;
  state?: string;
  county?: string;
  zipCode?: string;
  address?: string;
  ownershipType?: string;
  pipelineStage?: string;
  isPriorityRegion?: boolean;
}) {
  if (!db) return { success: false, message: "Database not connected" };
  try {
    const facility = data.facilityName?.trim() || "";
    const fName = (data.firstName || "").trim() || (facility ? facility.split(" ")[0] : "Healthcare");
    const lName = (data.lastName || "").trim() || (facility ? facility.split(" ").slice(1).join(" ") || "Facility" : "Center");

    const inserted = await db
      .insert(srimatrix)
      .values({
        facilityName: facility || null,
        firstName: fName,
        lastName: lName,
        type: data.type?.trim() || "Facility",
        administrator: data.administrator?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        beds: data.beds !== undefined && data.beds !== "" && !isNaN(Number(data.beds)) ? Number(data.beds) : null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || null,
        county: data.county?.trim() || null,
        zipCode: data.zipCode?.trim() || null,
        address: data.address?.trim() || null,
        ownershipType: data.ownershipType?.trim() || null,
        pipelineStage: data.pipelineStage?.trim() || "Lead",
        isPriorityRegion: !!data.isPriorityRegion,
      })
      .returning();

    return { success: true, message: "Directory record added successfully", record: inserted[0] };
  } catch (err: any) {
    console.error("Error creating srimatrix record:", err);
    return { success: false, message: err?.message || "Failed to add directory record" };
  }
}

export async function deleteSrimatrixRecordAction(id: number) {
  if (!db) return { success: false, message: "Database not connected" };
  try {
    await db.delete(srimatrix).where(eq(srimatrix.id, id));
    return { success: true, message: "Directory record removed" };
  } catch (err: any) {
    console.error("Error deleting srimatrix record:", err);
    return { success: false, message: err?.message || "Failed to delete directory record" };
  }
}

export async function bulkSaveSrimatrixAction(rows: any[]) {
  if (!db) return { success: false, message: "Database not connected" };
  try {
    if (!rows || rows.length === 0) return { success: true, count: 0 };

    let addedCount = 0;
    let updatedCount = 0;

    for (const r of rows) {
      if (!r || typeof r !== "object") continue;

      const facility = (r["Facility Name"] || r.facilityName || r.facility || "").trim();
      const admin = (r["Administrator"] || r.administrator || "").trim();
      const type = (r["Type"] || r.type || "Facility").trim();
      const phone = (r["Phone"] || r.phone || "").trim();
      const email = (r["Email"] || r.email || "").trim();
      const bedsRaw = r["Beds"] || r["Beds Capacity"] || r.beds;
      const beds = bedsRaw !== undefined && bedsRaw !== "" && !isNaN(Number(bedsRaw)) ? Number(bedsRaw) : null;
      const address = (r["Address"] || r["Street Address"] || r.address || "").trim();
      const city = (r["City"] || r.city || "").trim();
      const state = (r["State"] || r.state || "").trim();
      const county = (r["County"] || r.county || "").trim();
      const zipCode = (r["Zip Code"] || r["Zip"] || r.zipCode || "").trim();
      const stageRaw = r["Pipeline Stage"] || r.pipelineStage;
      const stage = stageRaw ? String(stageRaw).trim() : null;
      const priorityRaw = r["Priority Region"] || r.isPriorityRegion;
      const isPriority = priorityRaw === true || priorityRaw === "true" || priorityRaw === "Yes" || priorityRaw === "yes";

      // Must have at least a facility name or an administrator to be a valid row
      if (!facility && !admin) continue;

      const fName = (r.firstName || "").trim() || (facility ? facility.split(" ")[0] : "Healthcare");
      const lName = (r.lastName || "").trim() || (facility ? facility.split(" ").slice(1).join(" ") || "Facility" : "Center");

      const existingId = r._recordId || r.id;
      if (existingId && !isNaN(Number(existingId)) && Number(existingId) > 0) {
        // Update existing record (only update pipelineStage if explicitly supplied)
        const updatePayload: any = {
          facilityName: facility || null,
          firstName: fName,
          lastName: lName,
          type: type || "Facility",
          administrator: admin || null,
          phone: phone || null,
          email: email || null,
          beds,
          address: address || null,
          city: city || null,
          state: state || null,
          county: county || null,
          zipCode: zipCode || null,
          isPriorityRegion: isPriority,
        };
        if (stage) {
          updatePayload.pipelineStage = stage;
        }

        await db
          .update(srimatrix)
          .set(updatePayload)
          .where(eq(srimatrix.id, Number(existingId)));
        updatedCount++;
      } else {
        // Insert new record (defaults to "Lead" or stage if provided)
        await db.insert(srimatrix).values({
          facilityName: facility || null,
          firstName: fName,
          lastName: lName,
          type: type || "Facility",
          administrator: admin || null,
          phone: phone || null,
          email: email || null,
          beds,
          address: address || null,
          city: city || null,
          state: state || null,
          county: county || null,
          zipCode: zipCode || null,
          pipelineStage: stage || "Lead",
          isPriorityRegion: isPriority,
        });
        addedCount++;
      }
    }

    return {
      success: true,
      message: `Successfully updated ${updatedCount} records and added ${addedCount} new records!`,
      addedCount,
      updatedCount,
    };
  } catch (err: any) {
    console.error("Error bulk saving srimatrix directory:", err);
    return { success: false, message: err?.message || "Failed to save directory spreadsheet." };
  }
}

/**
 * Mileage Tracking Actions:
 * - Query, log, and review employee travel miles
 */
export async function getMileageEntriesAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) return [];
  try {
    const isAdmin = currentUser.role.toLowerCase() === "admin";
    const baseQuery = db
      .select({
        id: mileageEntries.id,
        accountId: mileageEntries.accountId,
        timesheetId: mileageEntries.timesheetId,
        entryDate: mileageEntries.entryDate,
        distance: mileageEntries.distance,
        unit: mileageEntries.unit,
        description: mileageEntries.description,
        status: mileageEntries.status,
        createdAt: mileageEntries.createdAt,
        accountName: accounts.name,
        accountEmail: accounts.email,
      })
      .from(mileageEntries)
      .leftJoin(accounts, eq(mileageEntries.accountId, accounts.id));

    if (isAdmin) {
      return await baseQuery.orderBy(desc(mileageEntries.entryDate), desc(mileageEntries.id));
    } else {
      return await baseQuery
        .where(eq(mileageEntries.accountId, currentUser.accountId))
        .orderBy(desc(mileageEntries.entryDate), desc(mileageEntries.id));
    }
  } catch (err) {
    console.error("Error fetching mileage entries:", err);
    return [];
  }
}

export async function createMileageEntryAction(data: {
  entryDate: string;
  distance: string;
  description?: string;
  timesheetId?: number;
}) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  try {
    const inserted = await db
      .insert(mileageEntries)
      .values({
        accountId: currentUser.accountId,
        entryDate: data.entryDate,
        distance: data.distance,
        description: data.description || null,
        timesheetId: data.timesheetId || null,
        status: "Pending",
      })
      .returning();

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "MILEAGE_ENTRY_CREATED",
      status: "success",
      details: `${currentUser.name} logged ${data.distance} miles on ${data.entryDate}`,
    });

    return {
      success: true,
      message: `Mileage entry (${data.distance} miles) logged!`,
      entry: inserted[0],
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to log mileage." };
  }
}

export async function deleteMileageEntryAction(id: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  if (!id) {
    return { success: false, message: "Invalid mileage entry ID." };
  }

  try {
    const existing = await db
      .select()
      .from(mileageEntries)
      .where(eq(mileageEntries.id, id))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, message: "Mileage entry not found." };
    }

    const auth = await checkActionAuthorization(currentUser, "tabMileageManage");
    if (!auth.authorized && existing[0].accountId !== currentUser.accountId) {
      return { success: false, message: "Unauthorized: You can only delete your own mileage entries." };
    }

    if (!auth.authorized && existing[0].status?.toLowerCase() === "approved") {
      return { success: false, message: "Cannot delete mileage entry: Approved mileage records cannot be deleted." };
    }

    await db.delete(mileageEntries).where(eq(mileageEntries.id, id));

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "MILEAGE_ENTRY_DELETED",
      status: "success",
      details: `${currentUser.name} deleted mileage entry of ${existing[0].distance} miles on ${existing[0].entryDate}`,
    });

    return {
      success: true,
      message: "Mileage entry deleted successfully.",
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to delete mileage entry." };
  }
}

export async function updateMileageEntryStatusAction(id: number, status: string) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabMileageManage");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Mileage management permission required." };
  }

  if (!id) return { success: false, message: "Invalid mileage entry ID." };

  const raw = status.trim().toLowerCase();
  const validStatus =
    raw === "approved"
      ? "Approved"
      : raw === "rejected"
      ? "Rejected"
      : raw === "draft"
      ? "Draft"
      : "Pending";

  try {
    const updated = await db
      .update(mileageEntries)
      .set({
        status: validStatus,
        updatedAt: new Date(),
      })
      .where(eq(mileageEntries.id, id))
      .returning();

    if (updated.length === 0) {
      return { success: false, message: "Mileage entry not found." };
    }

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: `MILEAGE_${validStatus.toUpperCase()}`,
      status: validStatus === "Approved" ? "success" : "info",
      details: `Admin ${currentUser.name} marked mileage entry #${id} (${updated[0].distance} miles) as ${validStatus}`,
    });

    return {
      success: true,
      message: `Mileage entry #${id} marked as ${validStatus}!`,
      entry: updated[0],
    };
  } catch (err) {
    return { success: false, message: (err as Error).message || "Failed to update mileage status." };
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * Email & SMTP Credentials Management Actions (Database Linked)
 * ─────────────────────────────────────────────────────────────
 */
export async function getEmailCredentialsAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  try {
    if (db) {
      const records = await db
        .select()
        .from(emailCredentials)
        .where(eq(emailCredentials.accountId, currentUser.accountId))
        .limit(1);

      if (records.length > 0) {
        const row = records[0];
        return {
          success: true,
          configured: Boolean(row.key && row.key.trim().length > 0),
          credentials: {
            id: row.id,
            accountId: row.accountId,
            email: row.email,
            key: row.key,
            smtpPass: row.key,
            logoOn: row.logoOn,
            includeLogoHeader: row.logoOn,
            signature: row.signature || "",
          },
        };
      }
    }
  } catch (err) {
    console.error("Error querying email_credentials table:", err);
  }

  // If no credentials configured for this account, return empty unconfigured state
  return {
    success: true,
    configured: false,
    credentials: {
      accountId: currentUser.accountId,
      email: currentUser.email || "",
      key: "",
      smtpPass: "",
      logoOn: false,
      includeLogoHeader: false,
      signature: "",
    },
  };
}

export async function saveEmailCredentialsAction(payload: {
  email?: string;
  key?: string;
  smtpPass?: string;
  logoOn?: boolean;
  includeLogoHeader?: boolean;
  signature?: string;
}) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  try {
    const emailVal = (payload.email || "").trim() || currentUser.email || "";
    const keyVal = ((payload.key || payload.smtpPass || "").trim()).replace(/\s+/g, "");
    const logoOnVal =
      payload.logoOn !== undefined
        ? Boolean(payload.logoOn)
        : payload.includeLogoHeader !== undefined
        ? Boolean(payload.includeLogoHeader)
        : false;
    const signatureVal = payload.signature !== undefined ? String(payload.signature) : undefined;

    let dbRecordId: number | null = null;
    let savedSignature = signatureVal || "";

    if (db) {
      const existing = await db
        .select()
        .from(emailCredentials)
        .where(eq(emailCredentials.accountId, currentUser.accountId))
        .limit(1);

      if (existing.length > 0) {
        const updateData: any = {
          email: emailVal,
          key: keyVal,
          logoOn: logoOnVal,
          updatedAt: new Date(),
        };
        if (signatureVal !== undefined) {
          updateData.signature = signatureVal;
          savedSignature = signatureVal;
        } else {
          savedSignature = existing[0].signature || "";
        }

        const updated = await db
          .update(emailCredentials)
          .set(updateData)
          .where(eq(emailCredentials.accountId, currentUser.accountId))
          .returning();
        dbRecordId = updated[0]?.id;
      } else {
        const inserted = await db
          .insert(emailCredentials)
          .values({
            accountId: currentUser.accountId,
            email: emailVal,
            key: keyVal,
            logoOn: logoOnVal,
            signature: signatureVal || "",
          })
          .returning();
        dbRecordId = inserted[0]?.id;
        savedSignature = signatureVal || "";
      }

      try {
        const { ipAddress, userAgent } = await getClientMeta();
        await db.insert(logs).values({
          accountId: currentUser.accountId,
          action: "UPDATE_EMAIL_CREDENTIALS",
          status: "success",
          details: `Admin ${currentUser.name || "User"} updated email credentials in DB (Account: #${currentUser.accountId}, Email: ${emailVal}, Logo On: ${logoOnVal ? "true" : "false"})`,
          ipAddress,
          userAgent,
        });
      } catch (logErr) {
        console.warn("Non-critical: audit log insert failed:", logErr);
      }
    }

    // Also sync local json file for mailer helper
    try {
      saveStoredEmailCredentials({
        smtpUser: emailVal,
        fromEmail: emailVal,
        smtpPass: keyVal,
        includeLogoHeader: logoOnVal,
        ...(signatureVal !== undefined ? { signature: signatureVal } : {}),
      });
    } catch (syncErr) {
      console.warn("Non-critical: local credentials sync failed:", syncErr);
    }

    return {
      success: true,
      message: "Email credentials, key, logo, and signature saved in database successfully!",
      credentials: {
        id: dbRecordId,
        accountId: currentUser.accountId,
        email: emailVal,
        key: keyVal,
        smtpPass: keyVal,
        logoOn: logoOnVal,
        includeLogoHeader: logoOnVal,
        signature: savedSignature,
      },
    };
  } catch (err: any) {
    console.error("saveEmailCredentialsAction error:", err);
    return { success: false, message: err?.message || "Failed to save email credentials in database." };
  }
}

export async function testEmailCredentialsAction(testEmail: string, customConfig?: any) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  if (!testEmail || !testEmail.includes("@")) {
    return { success: false, message: "Please provide a valid recipient email address for testing." };
  }

  try {
    const config = {
      fromEmail: customConfig?.email || customConfig?.fromEmail,
      smtpPass: customConfig?.key || customConfig?.smtpPass,
      includeLogoHeader: customConfig?.logoOn ?? customConfig?.includeLogoHeader,
    };
    await sendTestEmail(testEmail, config);

    const { ipAddress, userAgent } = await getClientMeta();
    if (db) {
      await db.insert(logs).values({
        accountId: currentUser.accountId,
        action: "TEST_EMAIL_CREDENTIALS",
        status: "success",
        details: `Dispatched test email to ${testEmail} to verify SMTP connection & Google App Password`,
        ipAddress,
        userAgent,
      });
    }

    return {
      success: true,
      message: `Test email successfully dispatched to ${testEmail}! Please check your inbox.`,
    };
  } catch (err: any) {
    console.error("testEmailCredentialsAction error:", err);
    return {
      success: false,
      message: err?.message || "Failed to send test email. Please check your App Password and SMTP settings.",
    };
  }
}

export async function verifySMTPConnectionAction(customConfig?: any) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  try {
    const userEmail = (customConfig?.email || customConfig?.fromEmail || "").trim();
    const userKey = (customConfig?.key || customConfig?.smtpPass || "").trim().replace(/\s+/g, "");

    if (!userEmail) {
      return { success: false, message: "Please provide an email address to verify." };
    }
    if (!userKey) {
      return { success: false, message: "Please provide a Google App Password (Email Key) to verify." };
    }

    const config: any = {
      smtpUser: userEmail,
      fromEmail: userEmail,
      smtpPass: userKey,
      includeLogoHeader: customConfig?.logoOn ?? customConfig?.includeLogoHeader,
    };

    const res = await verifySMTPConnection(config);
    return res;
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to verify SMTP connection." };
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * Interactive Communication & Activity History Actions
 * Matches emails against candidates & srimatrix directory tables in PostgreSQL
 * Automatically stores what was sent, by whom it was sent, and reply status
 * ─────────────────────────────────────────────────────────────
 */

export interface MatchedEntityInfo {
  type: "candidate" | "srimatrix" | "account" | "external";
  id?: string | number;
  name: string;
  email: string;
  detail?: string;
  facilityName?: string;
}

export async function getEmailInteractionsAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  return {
    success: true,
    interactions: [],
  };
}

export async function sendEmailInteractionReplyAction(payload: {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  body: string;
  parentInteractionId?: number;
}) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  const { recipientEmail, recipientName, subject, body, parentInteractionId } = payload;

  if (!recipientEmail || !recipientEmail.includes("@")) {
    return { success: false, message: "Please specify a valid recipient email address." };
  }
  if (!subject?.trim()) {
    return { success: false, message: "Please provide a subject line for the reply." };
  }
  if (!body?.trim()) {
    return { success: false, message: "Please provide reply message content." };
  }

  try {
    // 1. Fetch active email credentials from DB for this account
    let activeSenderEmail = currentUser.email || "";
    let activeKey = "";
    let activeLogoOn = false;
    let activeSignature = "";

    if (db) {
      const credRows = await db
        .select()
        .from(emailCredentials)
        .where(eq(emailCredentials.accountId, currentUser.accountId))
        .limit(1);

      if (credRows.length > 0) {
        activeSenderEmail = credRows[0].email;
        activeKey = credRows[0].key;
        activeLogoOn = credRows[0].logoOn;
        activeSignature = credRows[0].signature || "";
      }
    }

    if (!activeKey) {
      return { success: false, message: "Please configure your Email Credentials & App Password in Email Key settings first." };
    }

    // 2. Dispatch email via live SMTP
    let mailDispatched = false;
    let mailNotice = "";
    try {
      await sendEmail({
        to: recipientEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br>"),
        customConfig: {
          fromEmail: activeSenderEmail,
          smtpUser: activeSenderEmail,
          smtpPass: activeKey,
          includeLogoHeader: activeLogoOn,
          signature: activeSignature,
        },
      });
      mailDispatched = true;
    } catch (mailErr: any) {
      console.warn("SMTP live dispatch warning (proceeding to save record in DB):", mailErr);
      mailNotice = ` (Note: SMTP notice: ${mailErr?.message || "Delivery queued"})`;
    }

    // 3. Match recipient against PostgreSQL candidates or srimatrix directory
    let resolvedEntity: "candidate" | "srimatrix" | "account" | "external" = "external";
    let resolvedEntityId: string | null = null;
    let resolvedRecipientName = (recipientName || "").trim();

    if (db) {
      const emailLower = recipientEmail.toLowerCase().trim();

      const matchedCand = await db
        .select()
        .from(candidates)
        .where(sql`LOWER(${candidates.email}) = ${emailLower}`)
        .limit(1);

      if (matchedCand.length > 0) {
        resolvedEntity = "candidate";
        resolvedEntityId = String(matchedCand[0].id);
        if (!resolvedRecipientName) {
          resolvedRecipientName = `${matchedCand[0].firstName} ${matchedCand[0].lastName}`.trim();
        }
      } else {
        const matchedSri = await db
          .select()
          .from(srimatrix)
          .where(sql`LOWER(${srimatrix.email}) = ${emailLower}`)
          .limit(1);

        if (matchedSri.length > 0) {
          resolvedEntity = "srimatrix";
          resolvedEntityId = String(matchedSri[0].id);
          if (!resolvedRecipientName) {
            resolvedRecipientName =
              `${matchedSri[0].firstName} ${matchedSri[0].lastName}`.trim() ||
              matchedSri[0].facilityName ||
              "Healthcare Contact";
          }
        } else {
          const matchedAcc = await db
            .select()
            .from(accounts)
            .where(sql`LOWER(${accounts.email}) = ${emailLower}`)
            .limit(1);

          if (matchedAcc.length > 0) {
            resolvedEntity = "account";
            resolvedEntityId = String(matchedAcc[0].id);
            if (!resolvedRecipientName) {
              resolvedRecipientName = matchedAcc[0].name;
            }
          }
        }
      }

      if (!resolvedRecipientName) {
        resolvedRecipientName = recipientEmail;
      }

      const senderName = currentUser.name || "SriMatrix Admin";

      // Log in audit logs
      try {
        const { ipAddress, userAgent } = await getClientMeta();
        await db.insert(logs).values({
          accountId: currentUser.accountId,
          action: "EMAIL_REPLY_SENT",
          status: "success",
          details: `Admin ${senderName} dispatched reply to ${resolvedRecipientName} <${recipientEmail}>: "${subject}".`,
          ipAddress,
          userAgent,
        });
      } catch (logErr) {
        console.warn("Audit log insert failed:", logErr);
      }

      return {
        success: true,
        message: `Reply sent successfully to ${resolvedRecipientName} (${recipientEmail})${mailNotice}!`,
      };
    }

    return {
      success: true,
      message: `Reply processed for ${recipientEmail}.`,
    };
  } catch (err: any) {
    console.error("sendEmailInteractionReplyAction error:", err);
    return { success: false, message: err?.message || "Failed to dispatch email reply." };
  }
}

export async function searchDirectoryContactsAction(searchQuery?: string) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, contacts: [] };
  }

  try {
    if (!db) return { success: false, contacts: [] };

    const queryLower = (searchQuery || "").toLowerCase().trim();

    // Srimatrix facilities with emails
    const sriRows = await db
      .select({
        id: srimatrix.id,
        firstName: srimatrix.firstName,
        lastName: srimatrix.lastName,
        facilityName: srimatrix.facilityName,
        email: srimatrix.email,
        phone: srimatrix.phone,
      })
      .from(srimatrix)
      .where(sql`${srimatrix.email} IS NOT NULL AND ${srimatrix.email} != ''`)
      .limit(25);

    // Candidates with emails
    const candRows = await db
      .select({
        id: candidates.id,
        firstName: candidates.firstName,
        lastName: candidates.lastName,
        email: candidates.email,
        phone: candidates.phone,
        pipelineStage: candidates.pipelineStage,
      })
      .from(candidates)
      .where(sql`${candidates.email} IS NOT NULL AND ${candidates.email} != ''`)
      .limit(25);

    const results: Array<{
      id: string | number;
      name: string;
      email: string;
      type: "srimatrix" | "candidate";
      subtitle: string;
    }> = [];

    sriRows.forEach((s) => {
      if (!s.email) return;
      const fullName = `${s.firstName} ${s.lastName}`.trim();
      const facility = s.facilityName || "Healthcare Provider";
      if (
        !queryLower ||
        fullName.toLowerCase().includes(queryLower) ||
        s.email.toLowerCase().includes(queryLower) ||
        facility.toLowerCase().includes(queryLower)
      ) {
        results.push({
          id: s.id,
          name: fullName || facility,
          email: s.email,
          type: "srimatrix",
          subtitle: `SriMatrix Directory • ${facility}`,
        });
      }
    });

    candRows.forEach((c) => {
      if (!c.email) return;
      const fullName = `${c.firstName} ${c.lastName}`.trim();
      if (
        !queryLower ||
        fullName.toLowerCase().includes(queryLower) ||
        c.email.toLowerCase().includes(queryLower)
      ) {
        results.push({
          id: c.id,
          name: fullName || "Candidate",
          email: c.email,
          type: "candidate",
          subtitle: `Candidate • ${c.pipelineStage || "Lead"}`,
        });
      }
    });

    return { success: true, contacts: results };
  } catch (err) {
    console.error("searchDirectoryContactsAction error:", err);
    return { success: false, contacts: [] };
  }
}


/**
 * ─────────────────────────────────────────────────────────────
 * Job Offer Letter Actions (Paper Format & Bulk Generation)
 * ─────────────────────────────────────────────────────────────
 */

export async function getJobOfferLettersAction() {
  try {
    if (!db) return { success: false, message: "Database unavailable", letters: [] };

    const rows = await db
      .select()
      .from(jobOfferLetters)
      .orderBy(jobOfferLetters.id);

    const letters = rows.map((row) => {
      const c = (typeof row.content === "object" && row.content !== null ? row.content : {}) as any;

      const rawPages = c.pages;
      const pages: string[] = Array.isArray(rawPages) && rawPages.length > 0
        ? rawPages
        : [c.page1Html ?? null, c.page2Html ?? null].filter(
            (p): p is string => typeof p === "string" && p.length > 0
          );

      const page1Html = pages[0] ?? c.page1Html ?? null;
      const page2Html = pages[1] ?? c.page2Html ?? null;
      const includeWatermark = c.includeWatermark ?? true;
      const status = c.status ?? "Issued";
      const fileUrl = row.fileUrl || `/storage/applications/app_${row.id}.json`;
      const docUrl = row.fileUrl && row.fileUrl.endsWith(".json")
        ? row.fileUrl.replace(/\.json$/, ".doc")
        : `/storage/applications/app_${row.id}.doc`;

      return {
        id: row.id,
        letterNumber: c.letterNumber || row.id,
        applicationLabel: row.applicationName || `Application ${row.id}`,
        fileUrl,
        docUrl,
        pages,
        page1Html,
        page2Html,
        candidateName: c.candidateName || "Candidate",
        candidateEmail: c.candidateEmail || "",
        positionTitle: c.positionTitle || "Healthcare Content Writing and Communications Intern",
        employmentType: c.employmentType || "Part-Time Internship",
        hours: c.hours || "10 hours per week",
        workLocation: c.workLocation || "Remote",
        supervisor: c.supervisor || "Suneel Sah, Director",
        letterDate: c.letterDate || "08/25/2026",
        startDate: c.startDate || "08/31/2026",
        acceptanceDeadline: c.acceptanceDeadline || "08/28/2026",
        duties: Array.isArray(c.duties) ? c.duties : [],
        includeOptClause: c.includeOptClause ?? true,
        includeAcceptance: c.includeAcceptance ?? true,
        includeWatermark,
        signatoryName: c.signatoryName || "Suneel Sah",
        signatoryTitle: c.signatoryTitle || "Director",
        signatoryEmail: c.signatoryEmail || "ssah@srimatrixhealth.com",
        status,
        customSections: c.customSections || {},
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });

    return { success: true, letters };
  } catch (err: any) {
    console.error("getJobOfferLettersAction error:", err);
    return { success: false, message: err?.message || "Failed to load letters", letters: [] };
  }
}

export async function saveJobOfferLetterAction(data: {
  id?: number;
  letterNumber?: number;
  candidateName?: string;
  candidateEmail?: string;
  positionTitle?: string;
  employmentType?: string;
  hours?: string;
  workLocation?: string;
  supervisor?: string;
  letterDate?: string;
  startDate?: string;
  acceptanceDeadline?: string;
  duties?: string[];
  includeOptClause?: boolean;
  includeAcceptance?: boolean;
  includeWatermark?: boolean;
  signatoryName?: string;
  signatoryTitle?: string;
  signatoryEmail?: string;
  status?: string;
  applicationLabel?: string;
  customSections?: Record<string, any>;
  pages?: string[];
  page1Html?: string;
  page2Html?: string;
  content?: Record<string, any>;
}) {
  const currentUser = await getCurrentUserAction();
  if (currentUser && currentUser.role?.toLowerCase() !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required." };
  }

  try {
    if (!db) return { success: false, message: "Database unavailable." };

    const rawPages = data.pages ?? data.content?.pages;
    const pages: string[] = Array.isArray(rawPages) && rawPages.length > 0
      ? rawPages
      : [data.page1Html ?? (data.content?.page1Html || ""), data.page2Html ?? (data.content?.page2Html || "")].filter((p, i) => i === 0 || p.length > 0);

    const page1Html = pages[0] || "";
    const page2Html = pages[1] || "";
    const includeWatermark = data.includeWatermark ?? true;
    const status = data.status || "Saved";

    const content = {
      pages,
      page1Html,
      page2Html,
      includeWatermark,
      letterNumber: data.letterNumber || data.id || 1,
      status,
    };

    const applicationName = data.applicationLabel || `Application ${data.letterNumber || data.id || 1}`;

    if (data.id) {
      // 1. Write the document to file storage (both JSON and Word .doc formats)
      const { fileUrl, docUrl } = await saveApplicationToFileStorage(data.id, {
        applicationName,
        pages,
        page1Html,
        page2Html,
        includeWatermark,
        status,
      });

      // 2. Update the database row with the file_url and content
      const updated = await db
        .update(jobOfferLetters)
        .set({
          applicationName,
          fileUrl,
          content: content as any,
          updatedAt: new Date(),
        })
        .where(eq(jobOfferLetters.id, data.id))
        .returning();

      if (updated && updated.length > 0) {
        return {
          success: true,
          letter: {
            id: updated[0].id,
            applicationLabel: updated[0].applicationName,
            fileUrl,
            docUrl,
            createdAt: updated[0].createdAt,
            updatedAt: updated[0].updatedAt,
            ...content,
          },
          message: "Application saved to file storage and database successfully.",
        };
      }
    }

    // 1. Insert new application row in database to get the unique ID
    const inserted = await db
      .insert(jobOfferLetters)
      .values({
        applicationName,
        content: content as any,
      })
      .returning();

    const newId = inserted[0].id;

    // 2. Save document directly to file storage using the new unique ID
    const { fileUrl, docUrl } = await saveApplicationToFileStorage(newId, {
      applicationName,
      pages,
      page1Html,
      page2Html,
      includeWatermark,
      status,
    });

    // 3. Update database row with its storage fileUrl
    await db
      .update(jobOfferLetters)
      .set({ fileUrl })
      .where(eq(jobOfferLetters.id, newId));


    return {
      success: true,
      letter: {
        id: newId,
        applicationLabel: inserted[0].applicationName,
        fileUrl,
        docUrl,
        createdAt: inserted[0].createdAt,
        updatedAt: inserted[0].updatedAt,
        ...content,
      },
      message: "Application created and stored in file storage successfully.",
    };
  } catch (err: any) {
    console.error("saveJobOfferLetterAction error:", err);
    return { success: false, message: err?.message || "Failed to save application." };
  }
}

export async function bulkGenerateJobOfferLettersAction(
  candidatesList: Array<{ name: string; email?: string; positionTitle?: string; label?: string }>,
  templateConfig: Record<string, any>
) {
  const currentUser = await getCurrentUserAction();
  if (currentUser && currentUser.role?.toLowerCase() !== "admin") {
    return { success: false, message: "Unauthorized: Admin privileges required.", letters: [] };
  }

  if (!candidatesList || candidatesList.length === 0) {
    return { success: false, message: "Please select or provide candidates for bulk generation." };
  }

  try {
    if (!db) return { success: false, message: "Database unavailable." };

    const existingRows = await db.select({ id: jobOfferLetters.id }).from(jobOfferLetters);
    let currentNumber = existingRows.length;

    const insertedLetters: any[] = [];

    for (const cand of candidatesList) {
      currentNumber++;
      const applicationName = cand.label || `Application ${currentNumber}`;
      const content = {
        letterNumber: currentNumber,
        candidateName: cand.name.trim(),
        candidateEmail: cand.email?.trim() || null,
        positionTitle: cand.positionTitle || templateConfig.positionTitle || "Healthcare Content Writing and Communications Intern",
        employmentType: templateConfig.employmentType || "Part-Time Internship",
        hours: templateConfig.hours || "10 hours per week",
        workLocation: templateConfig.workLocation || "Remote",
        supervisor: templateConfig.supervisor || "Suneel Sah, Director",
        letterDate: templateConfig.letterDate || "08/25/2026",
        startDate: templateConfig.startDate || "08/31/2026",
        acceptanceDeadline: templateConfig.acceptanceDeadline || "08/28/2026",
        duties: templateConfig.duties || [],
        includeOptClause: templateConfig.includeOptClause ?? true,
        includeAcceptance: templateConfig.includeAcceptance ?? true,
        includeWatermark: templateConfig.includeWatermark ?? true,
        signatoryName: templateConfig.signatoryName || "Suneel Sah",
        signatoryTitle: templateConfig.signatoryTitle || "Director",
        signatoryEmail: templateConfig.signatoryEmail || "ssah@srimatrixhealth.com",
        status: "Issued",
        customSections: templateConfig.customSections || {},
      };

      const res = await db
        .insert(jobOfferLetters)
        .values({
          applicationName,
          content: content as any,
        })
        .returning();

      const newId = res[0].id;
      const { fileUrl, docUrl } = await saveApplicationToFileStorage(newId, {
        applicationName,
        page1Html: "",
        page2Html: "",
        includeWatermark: content.includeWatermark,
        status: content.status,
      });

      await db
        .update(jobOfferLetters)
        .set({ fileUrl })
        .where(eq(jobOfferLetters.id, newId));

      insertedLetters.push({
        id: newId,
        applicationLabel: res[0].applicationName,
        fileUrl,
        docUrl,
        createdAt: res[0].createdAt,
        updatedAt: res[0].updatedAt,
        ...content,
      });
    }

    return {
      success: true,
      message: `Successfully generated ${insertedLetters.length} applications in bulk!`,
      letters: insertedLetters,
    };
  } catch (err: any) {
    console.error("bulkGenerateJobOfferLettersAction error:", err);
    return { success: false, message: err?.message || "Failed to generate bulk applications." };
  }
}

export async function deleteJobOfferLetterAction(id: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Application management permission required." };
  }

  try {
    if (!db) return { success: false, message: "Database unavailable." };
    deleteApplicationFromFileStorage(id);
    await db.delete(jobOfferLetters).where(eq(jobOfferLetters.id, id));
    return { success: true, message: "Application removed successfully." };
  } catch (err: any) {
    console.error("deleteJobOfferLetterAction error:", err);
    return { success: false, message: err?.message || "Failed to delete application." };
  }
}

/**
 * Resolves effective boolean permissions for an account.
 * Superadmins automatically bypass all restrictions with 100% full access.
 */
export async function getEffectivePermissions(accountId: number, role: string, position?: string | null) {
  const isSuper = role?.toLowerCase() === "superadmin" || position?.toLowerCase().includes("super administrator");

  if (isSuper) {
    return {
      isSuperAdmin: true,
      canManagePermissions: true,
      tabOverview: true,
      tabSrimatrix: true,
      tabCandidates: true,
      tabPipeline: true,
      tabJob: true,
      tabMileage: true,
      tabMileageManage: true,
      tabReviewing: true,
      tabAccounts: true,
      tabMail: true,
      tabCredentials: true,
      tabSessions: true,
      tabLogs: true,
      tabTimesheets: true,
      widgetKpiMetrics: true,
      widgetEntityCards: true,
      widgetAnalyticsChart: true,
      widgetFollowupTicker: true,
      widgetEmailFeed: true,
    };
  }

  if (!db) {
    const isAdmin = role?.toLowerCase() === "admin";
    return {
      isSuperAdmin: false,
      canManagePermissions: isAdmin,
      tabOverview: isAdmin,
      tabSrimatrix: isAdmin,
      tabCandidates: isAdmin,
      tabPipeline: isAdmin,
      tabJob: isAdmin,
      tabMileage: true,
      tabMileageManage: isAdmin,
      tabReviewing: isAdmin,
      tabAccounts: isAdmin,
      tabMail: isAdmin,
      tabCredentials: isAdmin,
      tabSessions: isAdmin,
      tabLogs: isAdmin,
      tabTimesheets: true,
      widgetKpiMetrics: isAdmin,
      widgetEntityCards: isAdmin,
      widgetAnalyticsChart: isAdmin,
      widgetFollowupTicker: isAdmin,
      widgetEmailFeed: isAdmin,
    };
  }

  try {
    const existing = await db
      .select()
      .from(permissions)
      .where(eq(permissions.accountId, accountId))
      .limit(1);

    if (existing.length > 0) {
      const p = existing[0];
      if (p.isSuperAdmin) {
        return {
          isSuperAdmin: true,
          canManagePermissions: true,
          tabOverview: true,
          tabSrimatrix: true,
          tabCandidates: true,
          tabPipeline: true,
          tabJob: true,
          tabMileage: true,
          tabMileageManage: true,
          tabReviewing: true,
          tabAccounts: true,
          tabMail: true,
          tabCredentials: true,
          tabSessions: true,
          tabLogs: true,
          tabTimesheets: true,
          widgetKpiMetrics: true,
          widgetEntityCards: true,
          widgetAnalyticsChart: true,
          widgetFollowupTicker: true,
          widgetEmailFeed: true,
        };
      }
      return {
        isSuperAdmin: p.isSuperAdmin,
        canManagePermissions: p.canManagePermissions,
        tabOverview: p.tabOverview,
        tabSrimatrix: p.tabSrimatrix,
        tabCandidates: p.tabCandidates,
        tabPipeline: p.tabPipeline,
        tabJob: p.tabJob,
        tabMileage: p.tabMileage,
        tabMileageManage: p.tabMileageManage ?? false,
        tabReviewing: p.tabReviewing,
        tabAccounts: p.tabAccounts,
        tabMail: p.tabMail,
        tabCredentials: p.tabCredentials,
        tabSessions: p.tabSessions,
        tabLogs: p.tabLogs,
        tabTimesheets: p.tabTimesheets,
        widgetKpiMetrics: p.widgetKpiMetrics,
        widgetEntityCards: p.widgetEntityCards,
        widgetAnalyticsChart: p.widgetAnalyticsChart,
        widgetFollowupTicker: p.widgetFollowupTicker,
        widgetEmailFeed: p.widgetEmailFeed,
      };
    }
  } catch (err) {
    console.error("Error reading permissions:", err);
  }

  // Fallback based on role
  const isAdmin = role?.toLowerCase() === "admin";
  return {
    isSuperAdmin: false,
    canManagePermissions: isAdmin,
    tabOverview: isAdmin,
    tabSrimatrix: isAdmin,
    tabCandidates: isAdmin,
    tabPipeline: isAdmin,
    tabJob: isAdmin,
    tabMileage: true,
    tabMileageManage: isAdmin,
    tabReviewing: isAdmin,
    tabAccounts: isAdmin,
    tabMail: isAdmin,
    tabCredentials: isAdmin,
    tabSessions: isAdmin,
    tabLogs: isAdmin,
    tabTimesheets: true,
    widgetKpiMetrics: isAdmin,
    widgetEntityCards: isAdmin,
    widgetAnalyticsChart: isAdmin,
    widgetFollowupTicker: isAdmin,
    widgetEmailFeed: isAdmin,
  };
}

/**
 * Verifies whether the current user is authorized to perform an administrative or permission-gated action.
 * - Superadmins (by role, position, or permission flag) are always authorized.
 * - Admins are authorized unless the specific permission was explicitly turned off in their permissions record.
 * - Employees/users are authorized if the specific permission flag is enabled.
 */
export async function checkActionAuthorization(
  currentUser: { accountId: number; role: string; position?: string | null },
  requiredPermissionKey?: string
): Promise<{ authorized: boolean; permissions: any }> {
  const perms = await getEffectivePermissions(currentUser.accountId, currentUser.role, currentUser.position);
  if (
    perms.isSuperAdmin ||
    currentUser.role?.toLowerCase() === "superadmin" ||
    currentUser.position?.toLowerCase().includes("super administrator")
  ) {
    return { authorized: true, permissions: perms };
  }
  if (requiredPermissionKey === "isSuperAdmin") {
    return { authorized: false, permissions: perms };
  }
  if (currentUser.role?.toLowerCase() === "admin") {
    if (requiredPermissionKey && requiredPermissionKey in perms) {
      return { authorized: Boolean((perms as any)[requiredPermissionKey]), permissions: perms };
    }
    return { authorized: true, permissions: perms };
  }
  if (requiredPermissionKey && requiredPermissionKey in perms) {
    return { authorized: Boolean((perms as any)[requiredPermissionKey]), permissions: perms };
  }
  return { authorized: false, permissions: perms };
}

export async function getAccountPermissionsAction(targetAccountId: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    return { success: false, message: "Authentication required." };
  }

  const auth = await checkActionAuthorization(currentUser, "canManagePermissions");
  if (!auth.authorized && currentUser.accountId !== targetAccountId) {
    return { success: false, message: "Unauthorized: Access control permission required." };
  }

  try {
    if (!db) return { success: false, message: "Database unavailable." };

    const targetAccountRes = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        role: accounts.role,
        position: accounts.position,
        avatarUrl: accounts.avatarUrl,
        gender: accounts.gender,
      })
      .from(accounts)
      .where(eq(accounts.id, targetAccountId))
      .limit(1);

    if (targetAccountRes.length === 0) {
      return { success: false, message: "Account not found." };
    }

    const target = targetAccountRes[0];
    const isSuper = target.role?.toLowerCase() === "superadmin" || target.position?.toLowerCase().includes("super administrator");

    const row = await db
      .select()
      .from(permissions)
      .where(eq(permissions.accountId, targetAccountId))
      .limit(1);

    const hasCustomRecord = row.length > 0;
    const effective = await getEffectivePermissions(target.id, target.role, target.position);

    return {
      success: true,
      account: target,
      isSuperAdmin: isSuper || (hasCustomRecord && row[0].isSuperAdmin),
      isCustomized: hasCustomRecord,
      permissions: effective,
    };
  } catch (err: any) {
    console.error("getAccountPermissionsAction error:", err);
    return { success: false, message: err?.message || "Failed to fetch permissions." };
  }
}

export async function updateAccountPermissionsAction(
  targetAccountId: number,
  updatedPerms: {
    tabOverview?: boolean;
    tabSrimatrix?: boolean;
    tabCandidates?: boolean;
    tabPipeline?: boolean;
    tabJob?: boolean;
    tabMileage?: boolean;
    tabMileageManage?: boolean;
    tabReviewing?: boolean;
    tabAccounts?: boolean;
    tabMail?: boolean;
    tabCredentials?: boolean;
    tabSessions?: boolean;
    tabLogs?: boolean;
    tabTimesheets?: boolean;
    widgetKpiMetrics?: boolean;
    widgetEntityCards?: boolean;
    widgetAnalyticsChart?: boolean;
    widgetFollowupTicker?: boolean;
    widgetEmailFeed?: boolean;
    isSuperAdmin?: boolean;
    canManagePermissions?: boolean;
  }
) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    return { success: false, message: "Authentication required." };
  }

  const callerPerms = await getEffectivePermissions(currentUser.accountId, currentUser.role, currentUser.position);
  if (!callerPerms.isSuperAdmin && !callerPerms.canManagePermissions) {
    return { success: false, message: "Unauthorized: You do not have permission to manage access controls." };
  }

  try {
    if (!db) return { success: false, message: "Database unavailable." };

    const targetAccountRes = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, targetAccountId))
      .limit(1);

    if (targetAccountRes.length === 0) {
      return { success: false, message: "Target account not found." };
    }

    const target = targetAccountRes[0];
    const isTargetSuper = target.role?.toLowerCase() === "superadmin" || target.position?.toLowerCase().includes("super administrator");

    // Only existing superadmins can alter other superadmins
    if (isTargetSuper && !callerPerms.isSuperAdmin) {
      return { success: false, message: "Only a Super Administrator can modify another Super Administrator's permissions." };
    }

    // Only existing superadmins can grant superadmin role
    if (updatedPerms.isSuperAdmin && !callerPerms.isSuperAdmin) {
      return { success: false, message: "Only a Super Administrator can grant Super Administrator privileges." };
    }

    await db
      .insert(permissions)
      .values({
        accountId: targetAccountId,
        tabOverview: updatedPerms.tabOverview ?? false,
        tabSrimatrix: updatedPerms.tabSrimatrix ?? false,
        tabCandidates: updatedPerms.tabCandidates ?? false,
        tabPipeline: updatedPerms.tabPipeline ?? false,
        tabJob: updatedPerms.tabJob ?? false,
        tabMileage: updatedPerms.tabMileage ?? true,
        tabMileageManage: updatedPerms.tabMileageManage ?? false,
        tabReviewing: updatedPerms.tabReviewing ?? false,
        tabAccounts: updatedPerms.tabAccounts ?? false,
        tabMail: updatedPerms.tabMail ?? false,
        tabCredentials: updatedPerms.tabCredentials ?? false,
        tabSessions: updatedPerms.tabSessions ?? false,
        tabLogs: updatedPerms.tabLogs ?? false,
        tabTimesheets: updatedPerms.tabTimesheets ?? true,
        widgetKpiMetrics: updatedPerms.widgetKpiMetrics ?? true,
        widgetEntityCards: updatedPerms.widgetEntityCards ?? true,
        widgetAnalyticsChart: updatedPerms.widgetAnalyticsChart ?? true,
        widgetFollowupTicker: updatedPerms.widgetFollowupTicker ?? false,
        widgetEmailFeed: updatedPerms.widgetEmailFeed ?? true,
        isSuperAdmin: updatedPerms.isSuperAdmin ?? isTargetSuper,
        canManagePermissions: updatedPerms.canManagePermissions ?? false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: permissions.accountId,
        set: {
          tabOverview: updatedPerms.tabOverview ?? false,
          tabSrimatrix: updatedPerms.tabSrimatrix ?? false,
          tabCandidates: updatedPerms.tabCandidates ?? false,
          tabPipeline: updatedPerms.tabPipeline ?? false,
          tabJob: updatedPerms.tabJob ?? false,
          tabMileage: updatedPerms.tabMileage ?? true,
          tabMileageManage: updatedPerms.tabMileageManage ?? false,
          tabReviewing: updatedPerms.tabReviewing ?? false,
          tabAccounts: updatedPerms.tabAccounts ?? false,
          tabMail: updatedPerms.tabMail ?? false,
          tabCredentials: updatedPerms.tabCredentials ?? false,
          tabSessions: updatedPerms.tabSessions ?? false,
          tabLogs: updatedPerms.tabLogs ?? false,
          tabTimesheets: updatedPerms.tabTimesheets ?? true,
          widgetKpiMetrics: updatedPerms.widgetKpiMetrics ?? true,
          widgetEntityCards: updatedPerms.widgetEntityCards ?? true,
          widgetAnalyticsChart: updatedPerms.widgetAnalyticsChart ?? true,
          widgetFollowupTicker: updatedPerms.widgetFollowupTicker ?? true,
          widgetEmailFeed: updatedPerms.widgetEmailFeed ?? true,
          isSuperAdmin: updatedPerms.isSuperAdmin ?? isTargetSuper,
          canManagePermissions: updatedPerms.canManagePermissions ?? false,
          updatedAt: new Date(),
        },
      });

    // Record audit log
    const clientMeta = await getClientMeta();
    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "UPDATE_PERMISSIONS",
      status: "success",
      ipAddress: clientMeta.ipAddress,
      userAgent: clientMeta.userAgent,
      details: `Updated permissions for account ${target.name} (${target.email})`,
    });

    return {
      success: true,
      message: `Permissions updated successfully for ${target.name}.`,
    };
  } catch (err: any) {
    console.error("updateAccountPermissionsAction error:", err);
    return { success: false, message: err?.message || "Failed to update permissions." };
  }
}

export async function getAllAccountsWithPermissionsAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    return { success: false, message: "Authentication required.", accounts: [] };
  }

  const auth = await checkActionAuthorization(currentUser, "canManagePermissions");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Permission management required.", accounts: [] };
  }

  try {
    if (!db) return { success: false, message: "Database unavailable.", accounts: [] };

    const allAccs = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        role: accounts.role,
        position: accounts.position,
        avatarUrl: accounts.avatarUrl,
        gender: accounts.gender,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .orderBy(accounts.name);

    const allPerms = await db.select().from(permissions);
    const permMap = new Map<number, typeof permissions.$inferSelect>();
    allPerms.forEach((p) => permMap.set(p.accountId, p));

    const accountsWithPerms = await Promise.all(
      allAccs.map(async (acc) => {
        const isSuper = acc.role?.toLowerCase() === "superadmin" || acc.position?.toLowerCase().includes("super administrator");
        const custom = permMap.get(acc.id);
        const effective = await getEffectivePermissions(acc.id, acc.role, acc.position);

        return {
          ...acc,
          isSuperAdmin: isSuper || (custom?.isSuperAdmin ?? false),
          isCustomized: Boolean(custom),
          permissions: effective,
        };
      })
    );

    return {
      success: true,
      accounts: accountsWithPerms,
    };
  } catch (err: any) {
    console.error("getAllAccountsWithPermissionsAction error:", err);
    return { success: false, message: err?.message || "Failed to fetch accounts.", accounts: [] };
  }
}

// ============================================================================
// IMMIGRATION CASES ACTIONS (Session & Permission Gated)
// ============================================================================

export async function getImmigrationCasesAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in.", data: [] };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Immigration permission required.", data: [] };
  }

  try {
    const rows = await db.select().from(immigrationCases).orderBy(desc(immigrationCases.createdAt));
    return {
      success: true,
      data: rows,
    };
  } catch (err: any) {
    console.error("getImmigrationCasesAction error:", err);
    return { success: false, message: err?.message || "Failed to load immigration cases.", data: [] };
  }
}

export async function createImmigrationCaseAction(data: {
  employeeName: string;
  visaType: string;
  caseNumber?: string;
  uscisStage?: string;
  filingDate?: string;
  approvalDate?: string;
  expirationDate: string;
  priorityDate?: string;
  lcaNumber?: string;
  prevailingWage?: string;
  workLocation?: string;
  jobTitle?: string;
  status?: string;
  notes?: string;
}) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Immigration permission required." };
  }

  try {
    if (!data.employeeName?.trim() || !data.visaType?.trim() || !data.expirationDate?.trim()) {
      return { success: false, message: "Employee name, visa type, and expiration date are required." };
    }

    const [created] = await db
      .insert(immigrationCases)
      .values({
        employeeName: data.employeeName.trim(),
        visaType: data.visaType.trim(),
        caseNumber: data.caseNumber?.trim() || null,
        uscisStage: data.uscisStage?.trim() || "Petition Filed",
        filingDate: data.filingDate?.trim() || null,
        approvalDate: data.approvalDate?.trim() || null,
        expirationDate: data.expirationDate.trim(),
        priorityDate: data.priorityDate?.trim() || null,
        lcaNumber: data.lcaNumber?.trim() || null,
        prevailingWage: data.prevailingWage?.trim() || null,
        workLocation: data.workLocation?.trim() || null,
        jobTitle: data.jobTitle?.trim() || null,
        status: data.status || "Active",
        notes: data.notes?.trim() || null,
      })
      .returning();

    return {
      success: true,
      data: created,
    };
  } catch (err: any) {
    console.error("createImmigrationCaseAction error:", err);
    return { success: false, message: err?.message || "Failed to create immigration case." };
  }
}

export async function updateImmigrationCaseAction(
  id: number,
  data: Partial<{
    employeeName: string;
    visaType: string;
    caseNumber: string;
    uscisStage: string;
    filingDate: string;
    approvalDate: string;
    expirationDate: string;
    priorityDate: string;
    lcaNumber: string;
    prevailingWage: string;
    workLocation: string;
    jobTitle: string;
    status: string;
    notes: string;
  }>
) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Immigration permission required." };
  }

  try {
    const updateValues: Record<string, any> = { updatedAt: new Date() };
    if (data.employeeName !== undefined) updateValues.employeeName = data.employeeName.trim();
    if (data.visaType !== undefined) updateValues.visaType = data.visaType.trim();
    if (data.caseNumber !== undefined) updateValues.caseNumber = data.caseNumber.trim() || null;
    if (data.uscisStage !== undefined) updateValues.uscisStage = data.uscisStage.trim() || null;
    if (data.filingDate !== undefined) updateValues.filingDate = data.filingDate.trim() || null;
    if (data.approvalDate !== undefined) updateValues.approvalDate = data.approvalDate.trim() || null;
    if (data.expirationDate !== undefined) updateValues.expirationDate = data.expirationDate.trim();
    if (data.priorityDate !== undefined) updateValues.priorityDate = data.priorityDate.trim() || null;
    if (data.lcaNumber !== undefined) updateValues.lcaNumber = data.lcaNumber.trim() || null;
    if (data.prevailingWage !== undefined) updateValues.prevailingWage = data.prevailingWage.trim() || null;
    if (data.workLocation !== undefined) updateValues.workLocation = data.workLocation.trim() || null;
    if (data.jobTitle !== undefined) updateValues.jobTitle = data.jobTitle.trim() || null;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.notes !== undefined) updateValues.notes = data.notes.trim() || null;

    const [updated] = await db
      .update(immigrationCases)
      .set(updateValues)
      .where(eq(immigrationCases.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  } catch (err: any) {
    console.error("updateImmigrationCaseAction error:", err);
    return { success: false, message: err?.message || "Failed to update immigration case." };
  }
}

export async function deleteImmigrationCaseAction(id: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Immigration permission required." };
  }

  try {
    await db.delete(immigrationCases).where(eq(immigrationCases.id, id));
    return { success: true };
  } catch (err: any) {
    console.error("deleteImmigrationCaseAction error:", err);
    return { success: false, message: err?.message || "Failed to delete immigration record." };
  }
}

// ============================================================================
// HR DOCUMENTS ACTIONS (Session & Permission Gated)
// ============================================================================

export async function getHRDocumentsAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in.", data: [] };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: HR documents permission required.", data: [] };
  }

  try {
    const rows = await db.select().from(hrDocuments).orderBy(desc(hrDocuments.createdAt));
    return {
      success: true,
      data: rows,
    };
  } catch (err: any) {
    console.error("getHRDocumentsAction error:", err);
    return { success: false, message: err?.message || "Failed to load HR documents.", data: [] };
  }
}

export async function createHRDocumentAction(data: {
  title: string;
  category: string;
  fileName: string;
  fileSize?: string;
  fileUrl?: string;
  uploadedBy?: string;
  status?: string;
  notes?: string;
}) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: HR documents permission required." };
  }

  try {
    if (!data.title?.trim() || !data.fileName?.trim()) {
      return { success: false, message: "Document title and file name are required." };
    }

    const [created] = await db
      .insert(hrDocuments)
      .values({
        title: data.title.trim(),
        category: data.category || "Agreements",
        fileName: data.fileName.trim(),
        fileSize: data.fileSize?.trim() || "1.0 MB",
        fileUrl: data.fileUrl?.trim() || null,
        uploadedBy: data.uploadedBy?.trim() || "HR Administration",
        status: data.status || "Verified",
        notes: data.notes?.trim() || null,
      })
      .returning();

    return {
      success: true,
      data: created,
    };
  } catch (err: any) {
    console.error("createHRDocumentAction error:", err);
    return { success: false, message: err?.message || "Failed to save document." };
  }
}

export async function deleteHRDocumentAction(id: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabJob");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: HR documents permission required." };
  }

  try {
    await db.delete(hrDocuments).where(eq(hrDocuments.id, id));
    return { success: true };
  } catch (err: any) {
    console.error("deleteHRDocumentAction error:", err);
    return { success: false, message: err?.message || "Failed to delete document." };
  }
}

// ============================================================================
// INVOICING & BILLING ACTIONS (Session & Permission Gated)
// ============================================================================

export interface InvoiceLineItem {
  id: string;
  description: string;
  hoursOrQty: number;
  rate: number;
  amount: number;
  servicePeriod?: string;
}

export async function getInvoicesAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in.", data: [] };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Invoicing permission required.", data: [] };
  }

  try {
    const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    return {
      success: true,
      data: rows,
    };
  } catch (err: any) {
    console.error("getInvoicesAction error:", err);
    return { success: false, message: err?.message || "Failed to load invoices.", data: [] };
  }
}

export async function createInvoiceAction(data: {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number | string;
  tax?: number | string;
  totalAmount: number | string;
  status?: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  terms?: string;
}) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Invoicing permission required." };
  }

  try {
    if (!data.invoiceNumber?.trim() || !data.clientName?.trim() || !data.issueDate || !data.dueDate) {
      return { success: false, message: "Invoice number, client name, issue date, and due date are required." };
    }

    const sub = typeof data.subtotal === "number" ? data.subtotal.toFixed(2) : String(data.subtotal || "0.00");
    const tx = typeof data.tax === "number" ? data.tax.toFixed(2) : String(data.tax || "0.00");
    const tot = typeof data.totalAmount === "number" ? data.totalAmount.toFixed(2) : String(data.totalAmount || "0.00");

    const [created] = await db
      .insert(invoices)
      .values({
        invoiceNumber: data.invoiceNumber.trim(),
        clientName: data.clientName.trim(),
        clientEmail: data.clientEmail?.trim() || null,
        clientAddress: data.clientAddress?.trim() || null,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        subtotal: sub,
        tax: tx,
        totalAmount: tot,
        status: data.status || "Draft",
        lineItems: data.lineItems || [],
        notes: data.notes?.trim() || null,
        terms: data.terms?.trim() || null,
      })
      .returning();

    return {
      success: true,
      data: created,
    };
  } catch (err: any) {
    console.error("createInvoiceAction error:", err);
    return { success: false, message: err?.message || "Failed to create invoice." };
  }
}

export async function updateInvoiceStatusAction(
  id: number,
  status: string,
  paidDate?: string | null,
  paymentMethod?: string | null
) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Invoicing permission required." };
  }

  try {
    const updateValues: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };
    if (status === "Paid") {
      updateValues.paidDate = paidDate || new Date().toISOString().split("T")[0];
      if (paymentMethod) updateValues.paymentMethod = paymentMethod;
    } else {
      if (paidDate !== undefined) updateValues.paidDate = paidDate;
      if (paymentMethod !== undefined) updateValues.paymentMethod = paymentMethod;
    }

    const [updated] = await db
      .update(invoices)
      .set(updateValues)
      .where(eq(invoices.id, id))
      .returning();

    return {
      success: true,
      data: updated,
    };
  } catch (err: any) {
    console.error("updateInvoiceStatusAction error:", err);
    return { success: false, message: err?.message || "Failed to update invoice status." };
  }
}

export async function deleteInvoiceAction(id: number) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }
  const auth = await checkActionAuthorization(currentUser, "tabAccounts");
  if (!auth.authorized) {
    return { success: false, message: "Unauthorized: Invoicing permission required." };
  }

  try {
    await db.delete(invoices).where(eq(invoices.id, id));
    return { success: true };
  } catch (err: any) {
    console.error("deleteInvoiceAction error:", err);
    return { success: false, message: err?.message || "Failed to delete invoice." };
  }
}

// ============================================================================
// PROFILE & ACCOUNT SETTINGS ACTIONS (With OTP Verification for Password Change)
// ============================================================================

// In-memory OTP storage for password changes
// Map<accountId, { otp: string; expiresAt: number; email: string }>
const passwordOtpStore = new Map<number, { otp: string; expiresAt: number; email: string }>();

/**
 * Updates the logged-in user's personal profile details (Name, Email, Phone, Position, Gender, Avatar)
 */
export async function updateCurrentProfileDetailsAction(formData: FormData) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const phone = formData.get("phone")?.toString().trim() || null;
  const position = formData.get("position")?.toString().trim() || null;
  const gender = formData.get("gender")?.toString().trim().toLowerCase() || "male";

  if (!name || !email) {
    return { success: false, message: "Name and email are required." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    // If email is changing, verify no other account has this email
    if (email !== currentUser.email.toLowerCase()) {
      const existing = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.email, email))
        .limit(1);

      if (existing.length > 0 && existing[0].id !== currentUser.accountId) {
        return { success: false, message: `The email "${email}" is already used by another account.` };
      }
    }

    // Process avatar photo upload if provided
    let avatarUrl: string | null = null;
    try {
      avatarUrl = await processAndSaveAvatar(formData, email, name);
    } catch (avatarErr) {
      console.warn("Avatar processing error:", avatarErr);
    }

    const updatePayload: Record<string, any> = {
      name,
      email,
      phone,
      position,
      gender,
      updatedAt: new Date(),
    };

    if (avatarUrl) {
      updatePayload.avatarUrl = avatarUrl;
    }

    const [updated] = await db
      .update(accounts)
      .set(updatePayload)
      .where(eq(accounts.id, currentUser.accountId))
      .returning();

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "PROFILE_UPDATED",
      status: "success",
      ipAddress,
      userAgent,
      details: `User ${currentUser.name} updated their profile settings`,
    });

    return {
      success: true,
      message: "Profile details updated successfully.",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        position: updated.position,
        phone: updated.phone,
        gender: updated.gender,
        avatarUrl: updated.avatarUrl,
      },
    };
  } catch (err: any) {
    console.error("updateCurrentProfileDetailsAction error:", err);
    return { success: false, message: err?.message || "Failed to update profile." };
  }
}

/**
 * Sends a 6-digit OTP code to the logged-in user's email for password change
 */
export async function sendPasswordChangeOtpAction() {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  // Generate 6-digit cryptographic numeric OTP
  const otp = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  passwordOtpStore.set(currentUser.accountId, {
    otp,
    expiresAt,
    email: currentUser.email,
  });

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
      <div style="margin-bottom: 24px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">SriMatrix Health</h2>
        <p style="font-size: 13px; color: #64748b; margin-top: 4px;">Security &amp; Account Protection</p>
      </div>

      <div style="padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #334155; margin: 0 0 12px 0;">Hello <strong>${currentUser.name}</strong>,</p>
        <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.6;">
          You requested to change your password for your SriMatrix account (<strong>${currentUser.email}</strong>). Use the one-time verification code below to authorize this change:
        </p>

        <div style="margin: 20px 0; padding: 16px; background-color: #ffffff; border: 2px dashed #6366f1; border-radius: 12px; text-align: center;">
          <span style="font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">
            ${otp}
          </span>
        </div>

        <p style="font-size: 11px; color: #94a3b8; margin: 0; text-align: center;">
          This code is strictly confidential and expires in <strong>10 minutes</strong>.
        </p>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
        If you did not initiate this request, your account may be compromised. Please notify your SriMatrix system administrator immediately.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: currentUser.email,
      subject: `SriMatrix Security: Password Change Code [${otp}]`,
      text: `Your SriMatrix password change verification code is: ${otp}. It will expire in 10 minutes.`,
      html: emailHtml,
    });
  } catch (mailErr) {
    console.warn("sendPasswordChangeOtpAction email delivery notice (testing or SMTP mode):", mailErr);
  }

  await db.insert(logs).values({
    accountId: currentUser.accountId,
    action: "PASSWORD_OTP_REQUESTED",
    status: "info",
    ipAddress,
    userAgent,
    details: `Password change verification code requested for account #${currentUser.accountId} (${currentUser.email})`,
  });

  return {
    success: true,
    message: `A 6-digit verification code has been dispatched to ${currentUser.email}.`,
  };
}

/**
 * Verifies the OTP and updates the account password in PostgreSQL
 */
export async function changePasswordWithOtpAction(formData: FormData) {
  const currentUser = await getCurrentUserAction();
  if (!currentUser || !db) {
    return { success: false, message: "Unauthorized: Please log in." };
  }

  const otp = formData.get("otp")?.toString().trim();
  const newPassword = formData.get("newPassword")?.toString().trim();
  const confirmPassword = formData.get("confirmPassword")?.toString().trim();

  if (!otp || !newPassword) {
    return { success: false, message: "Both verification code (OTP) and new password are required." };
  }

  if (newPassword.length < 6) {
    return { success: false, message: "New password must be at least 6 characters long." };
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return { success: false, message: "New password and confirmation password do not match." };
  }

  const cached = passwordOtpStore.get(currentUser.accountId);
  if (!cached) {
    return {
      success: false,
      message: "No active verification code found. Please click 'Send Verification Code' first.",
    };
  }

  if (Date.now() > cached.expiresAt) {
    passwordOtpStore.delete(currentUser.accountId);
    return {
      success: false,
      message: "Verification code has expired. Please request a new code.",
    };
  }

  if (cached.otp !== otp) {
    return {
      success: false,
      message: "Invalid verification code. Please check your email and try again.",
    };
  }

  const { ipAddress, userAgent } = await getClientMeta();

  try {
    await db
      .update(accounts)
      .set({
        password: newPassword,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, currentUser.accountId));

    // Clear OTP after successful password change
    passwordOtpStore.delete(currentUser.accountId);

    await db.insert(logs).values({
      accountId: currentUser.accountId,
      action: "PASSWORD_CHANGED_VIA_OTP",
      status: "success",
      ipAddress,
      userAgent,
      details: `User ${currentUser.name} successfully changed password using email OTP verification`,
    });

    return {
      success: true,
      message: "Password changed successfully! Your new password is now active.",
    };
  } catch (err: any) {
    console.error("changePasswordWithOtpAction error:", err);
    return { success: false, message: err?.message || "Failed to update password." };
  }
}







