import config from "../../store.config.json";

/**
 * The single source of truth for everything the stores need to know about
 * where Nella lives. `scripts/check-store-config.mjs` refuses a release while
 * any of these is still the placeholder, because a dead support or privacy URL
 * gets the submission rejected.
 */
export const SITE_URL = config.siteUrl.replace(/\/+$/, "");
export const SUPPORT_EMAIL = config.supportEmail;
export const COPYRIGHT = config.copyright;

export const PRIVACY_URL = `${SITE_URL}/privacy`;
export const TERMS_URL = `${SITE_URL}/terms`;

/** True while the config still holds the example.com-style placeholder. */
export const STORE_LINKS_PENDING = /\.example$/.test(new URL(SITE_URL).hostname);
