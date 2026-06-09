export const getApiBaseUrl = (): string =>
  (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/** HTML template CRUD: {base}/templates/... */
export const getTemplatesApiBaseUrl = (): string => {
  const base = getApiBaseUrl();
  return base ? `${base}/templates` : "/templates";
};

/** S3 assets: /api/offer-letter-template-images (not under /v1). */
export const getOfferLetterTemplateImagesApiBaseUrl = (): string => {
  const base = getApiBaseUrl();
  if (!base) return "/api/offer-letter-template-images";
  if (/\/api\/v\d+$/i.test(base)) {
    return `${base.replace(/\/v\d+$/i, "")}/offer-letter-template-images`;
  }
  if (base.endsWith("/api")) {
    return `${base}/offer-letter-template-images`;
  }
  return `${base}/api/offer-letter-template-images`;
};
