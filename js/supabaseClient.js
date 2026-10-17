window.RL = window.RL || {};

(function initClient() {
  const cfg = window.RANK_LEDGER_CONFIG || {};
  const url = (cfg.SUPABASE_URL || "").trim();
  const key = (cfg.SUPABASE_ANON_KEY || "").trim();
  const placeholder =
    !url ||
    !key ||
    url.includes("YOUR_SUPABASE") ||
    key.includes("YOUR_SUPABASE");

  window.rlConfigError = placeholder;

  if (placeholder) {
    window.rlClient = null;
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    window.rlConfigError = true;
    window.rlClient = null;
    return;
  }

  window.rlClient = window.supabase.createClient(url, key);
})();
