/**
 * SimpleSaaS Centralized Logger — Client Utility
 *
 * Usage in a SvelteKit Cloudflare Worker app:
 *
 *   // Copy this file to: src/lib/server/logger.ts
 *
 *   // In a +page.server.ts or +server.ts:
 *   import { createLogger } from '$lib/server/logger';
 *
 *   export const load: PageServerLoad = async ({ platform }) => {
 *     const log = createLogger(platform?.env, 'pupbooks');
 *
 *     try {
 *       // ... your code ...
 *     } catch (e) {
 *       log.error('Failed to load invoices', { route: '/invoices', error: String(e) });
 *     }
 *   };
 *
 *   // Business event (e.g. in signup action):
 *   log.event('signup', userId, orgId, { plan: 'trial' });
 *   log.event('demo_view', null, null, { page: 'dashboard' });
 *
 * The logger uses ctx.waitUntil-style fire-and-forget via a Promise that is
 * NOT awaited — it never blocks the response. Failed sends are silently dropped
 * (logging should never cause app errors).
 *
 * IMPORTANT: Only log errors, warnings, and explicit business events.
 * Do NOT log every page request — that creates noise and R2 costs.
 */

/** Skip logging 404s from bots probing for WordPress/PHP exploits. */
export function isBotScannerPath(pathname: string): boolean {
  return (
    pathname.includes('wp-admin') ||
    pathname.includes('wp-includes') ||
    pathname.includes('wordpress') ||
    pathname.includes('xmlrpc.php') ||
    pathname.endsWith('.php')
  );
}

export type OpsLevel = 'error' | 'warn' | 'info';

export interface OpsEntry {
  type: 'ops';
  level: OpsLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  route?: string;
}

export interface EventEntry {
  type: 'event';
  event: string;
  userId?: string;
  orgId?: string;
  stripeId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export type LogEntry = OpsEntry | EventEntry;

// Matches the Cloudflare platform.env shape (only what we need)
interface PlatformEnv {
  LOGGER_URL?: string;
  LOGGER_SECRET?: string;
}

interface AppEnv {
  platform?: { env?: PlatformEnv } | null;
}

export interface Logger {
  /** Log an ops event (error, warn, or info) */
  ops(level: OpsLevel, message: string, context?: Record<string, unknown>, route?: string): void;
  /** Shorthand: log an error */
  error(message: string, context?: Record<string, unknown>, route?: string): void;
  /** Shorthand: log a warning */
  warn(message: string, context?: Record<string, unknown>, route?: string): void;
  /** Log a business event */
  event(
    eventName: string,
    userId?: string | null,
    orgId?: string | null,
    metadata?: Record<string, unknown>,
    stripeId?: string | null,
  ): void;
  /** Flush: explicitly send any pending entries immediately */
  flush(): void;
}

/**
 * Create a logger instance for a specific app.
 *
 * @param platformEnv  - Pass `platform?.env` from SvelteKit's RequestEvent
 * @param appName      - Unique identifier for this app (e.g. 'pupbooks', 'handymanschedule')
 */
export function createLogger(platformEnv: unknown, appName: string): Logger {
  const env = platformEnv as PlatformEnv | null | undefined;
  const loggerUrl = env?.LOGGER_URL;
  const loggerSecret = env?.LOGGER_SECRET;

  // Buffer entries to batch them in a single fetch
  const pending: LogEntry[] = [];
  let flushScheduled = false;

  function schedule() {
    if (flushScheduled) return;
    flushScheduled = true;
    // Use queueMicrotask so it fires after the current synchronous code finishes
    queueMicrotask(sendBatch);
  }

  function sendBatch() {
    if (!pending.length) return;
    const batch = pending.splice(0);
    flushScheduled = false;

    if (!loggerUrl || !loggerSecret) return; // not configured — silently skip

    // Fire-and-forget: we do NOT await this
    fetch(loggerUrl + '/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loggerSecret}`,
      },
      body: JSON.stringify({ app: appName, entries: batch }),
    }).catch(() => {
      // Silently swallow errors — logging must never break the app
    });
  }

  return {
    ops(level, message, context, route) {
      pending.push({
        type: 'ops',
        level,
        message,
        context,
        route,
        timestamp: new Date().toISOString(),
      });
      schedule();
    },

    error(message, context, route) {
      this.ops('error', message, context, route);
    },

    warn(message, context, route) {
      this.ops('warn', message, context, route);
    },

    event(eventName, userId, orgId, metadata, stripeId) {
      const entry: EventEntry = {
        type: 'event',
        event: eventName,
        timestamp: new Date().toISOString(),
      };
      if (userId) entry.userId = userId;
      if (orgId) entry.orgId = orgId;
      if (stripeId) entry.stripeId = stripeId;
      if (metadata && Object.keys(metadata).length) entry.metadata = metadata;
      pending.push(entry);
      schedule();
    },

    flush() {
      sendBatch();
    },
  };
}
