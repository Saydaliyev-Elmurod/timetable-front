/**
 * Logger — thin wrapper around console.* that strips dev-only calls in production.
 *
 * Use in place of direct `console.*` calls:
 *   - `logger.debug(...)` / `logger.log(...)` — compiled out in production builds
 *   - `logger.warn(...)` / `logger.error(...)` — always forwarded
 *
 * In production builds, `import.meta.env.PROD` is `true`; the dev-only methods
 * become no-ops. Error reporting (Sentry, etc.) can be wired in at the `error`
 * hook without changing call sites.
 */

const isProd = import.meta.env.PROD;

const noop = (..._args: unknown[]): void => {
  /* no-op in production */
};

export const logger = {
  log: isProd ? noop : (...args: unknown[]) => console.log(...args),
  debug: isProd ? noop : (...args: unknown[]) => console.debug(...args),
  info: isProd ? noop : (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};
