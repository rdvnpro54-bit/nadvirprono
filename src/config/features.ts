/**
 * Feature flags — single source of truth.
 *
 * PAYWALL_ENABLED = false  → all results, predictions and AI features are
 * public. The subscription architecture (Stripe, plans, admin overrides)
 * stays fully intact and can be re-enabled by flipping this to true.
 *
 * The backend mirrors this flag through the `PAYWALL_ENABLED` env var on the
 * edge functions (absent / "false" = paywall off).
 */
export const PAYWALL_ENABLED = false;
