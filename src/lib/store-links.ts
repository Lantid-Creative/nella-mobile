import config from "../../store.config.json";

/**
 * The single source of truth for where Nella lives. The store listings, the
 * legal pages and the support links all read from here so the app and the
 * marketing site can never point at different addresses.
 *
 * `store.config.json` is the file a human edits; everything else derives from
 * it. The Fastfile refuses to release while it still holds the placeholder,
 * because a dead support or privacy link is an automatic store rejection.
 */
export const SITE_URL = config.siteUrl.replace(/\/+$/, "");
export const SUPPORT_EMAIL = config.supportEmail;
export const COPYRIGHT = config.copyright;
export const APP_VERSION = config.appVersion;

/** Absolute link to a page on the marketing site. */
export function siteLink(path: string): string {
  return `${SITE_URL}${path}`;
}

/** The canonical, legally binding documents. The app links to these. */
export const PRIVACY_URL = siteLink(config.paths.privacy);
export const TERMS_URL = siteLink(config.paths.terms);
export const SUPPORT_URL = siteLink(config.paths.support);
export const SECURITY_URL = siteLink(config.paths.security);

/** True while the config still holds the example.com-style placeholder. */
export const STORE_LINKS_PENDING = /\.example$/.test(new URL(SITE_URL).hostname);
