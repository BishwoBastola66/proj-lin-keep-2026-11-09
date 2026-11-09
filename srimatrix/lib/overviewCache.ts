"use client";

import {
  getCandidatesAction,
  getPipelineFollowupsAction,
  getWorkforceAnalyticsAction,
  getDashboardRoleDataAction,
} from "@/app/actions/auth";

export type OverviewCacheKey =
  | "candidates"
  | "followups"
  | "analytics"
  | "dashboard";

interface CacheStore {
  candidates: any[] | null;
  followups: any[] | null;
  analytics: any | null;
  dashboard: any | null;
}

// In-memory persistent client cache singleton
const cacheStore: CacheStore = {
  candidates: null,
  followups: null,
  analytics: null,
  dashboard: null,
};

// In-flight promises to deduplicate simultaneous requests
const inflight: Partial<Record<OverviewCacheKey, Promise<any> | null>> = {};

// Subscriber listeners to notify components when cache is invalidated or updated
type CacheListener = (key: OverviewCacheKey | "all") => void;
const listeners = new Set<CacheListener>();

export function subscribeOverviewCache(listener: CacheListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(key: OverviewCacheKey | "all") {
  listeners.forEach((listener) => {
    try {
      listener(key);
    } catch (e) {
      console.error("Overview cache listener error:", e);
    }
  });
}

/**
 * Invalidate a specific cache key or all keys.
 * Removes data from in-memory cache so subsequent reads fetch fresh data from DB.
 */
export function invalidateOverviewCache(key?: OverviewCacheKey | "all") {
  if (!key || key === "all") {
    cacheStore.candidates = null;
    cacheStore.followups = null;
    cacheStore.analytics = null;
    cacheStore.dashboard = null;
    notifyListeners("all");
    return;
  }

  cacheStore[key] = null;
  notifyListeners(key);
}

/**
 * Directly set or optimistically update cached item.
 */
export function setCachedItem(key: OverviewCacheKey, data: any) {
  cacheStore[key] = data;
  notifyListeners(key);
}

// ── Synchronous Peek Getters (Zero-lag React state initialization) ──
export function getCachedCandidatesSync() {
  return cacheStore.candidates;
}
export function getCachedFollowupsSync() {
  return cacheStore.followups;
}
export function getCachedAnalyticsSync() {
  return cacheStore.analytics;
}
export function getCachedDashboardDataSync() {
  return cacheStore.dashboard;
}

// ── Async Cache-First Getters with In-Flight Request Deduplication ──


export async function getCachedCandidates(forceRefresh: boolean = false): Promise<any[]> {
  if (!forceRefresh && cacheStore.candidates !== null) {
    return cacheStore.candidates;
  }
  if (inflight.candidates) {
    return inflight.candidates;
  }

  const promise = (async () => {
    try {
      const res = await getCandidatesAction();
      const list = Array.isArray(res) ? res : [];
      cacheStore.candidates = list;
      return list;
    } catch (err) {
      console.error("getCachedCandidates error:", err);
      return cacheStore.candidates || [];
    } finally {
      inflight.candidates = null;
    }
  })();

  inflight.candidates = promise;
  return promise;
}

export async function getCachedFollowups(forceRefresh: boolean = false): Promise<any[]> {
  if (!forceRefresh && cacheStore.followups !== null) {
    return cacheStore.followups;
  }
  if (inflight.followups) {
    return inflight.followups;
  }

  const promise = (async () => {
    try {
      const res = await getPipelineFollowupsAction();
      const list = Array.isArray(res) ? res : [];
      cacheStore.followups = list;
      return list;
    } catch (err) {
      console.error("getCachedFollowups error:", err);
      return cacheStore.followups || [];
    } finally {
      inflight.followups = null;
    }
  })();

  inflight.followups = promise;
  return promise;
}

export async function getCachedAnalytics(forceRefresh: boolean = false): Promise<any> {
  if (!forceRefresh && cacheStore.analytics !== null) {
    return cacheStore.analytics;
  }
  if (inflight.analytics) {
    return inflight.analytics;
  }

  const promise = (async () => {
    try {
      const res = await getWorkforceAnalyticsAction();
      if (res) {
        cacheStore.analytics = res;
      }
      return res;
    } catch (err) {
      console.error("getCachedAnalytics error:", err);
      return cacheStore.analytics;
    } finally {
      inflight.analytics = null;
    }
  })();

  inflight.analytics = promise;
  return promise;
}

export async function getCachedDashboardData(forceRefresh: boolean = false): Promise<any> {
  if (!forceRefresh && cacheStore.dashboard !== null) {
    return cacheStore.dashboard;
  }
  if (inflight.dashboard) {
    return inflight.dashboard;
  }

  const promise = (async () => {
    try {
      const res = await getDashboardRoleDataAction();
      if (res && res.authenticated) {
        cacheStore.dashboard = res;
      }
      return res;
    } catch (err) {
      console.error("getCachedDashboardData error:", err);
      return cacheStore.dashboard;
    } finally {
      inflight.dashboard = null;
    }
  })();

  inflight.dashboard = promise;
  return promise;
}

/**
 * Preload all overview APIs in parallel.
 * Keeps them warm in memory so switching to Overview or loading the dashboard is 100% instantaneous.
 */
export async function preloadOverviewCache(forceRefresh: boolean = false) {
  try {
    await Promise.all([
      getCachedCandidates(forceRefresh),
      getCachedFollowups(forceRefresh),
      getCachedAnalytics(forceRefresh),
    ]);
  } catch (err) {
    console.error("preloadOverviewCache error:", err);
  }
}
