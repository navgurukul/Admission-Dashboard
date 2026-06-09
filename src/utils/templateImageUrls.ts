import type { OfferLetterTemplateImage } from "@/services/templateService";
import { getApiBaseUrl } from "@/utils/apiBase";

/** Local template paths (docx conversion / dev server), e.g. /images/ng.png — not S3. */
export const isLegacyTemplateImageUrl = (url: string): boolean => {
  if (!url?.trim()) return false;
  const lower = url.toLowerCase().trim();
  if (lower.startsWith("data:")) return false;
  if (lower.includes("amazonaws.com") || lower.includes(".s3.")) return false;

  return (
    lower.includes("localhost") ||
    lower.includes("/images/") ||
    /^\.?\/?images\//i.test(lower) ||
    (lower.startsWith("/") && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(lower))
  );
};

/** Backend host for PDF/static assets (strip /api/v1 from API base). */
export const getBackendPublicBaseUrl = (): string => {
  const explicit = import.meta.env.VITE_BACKEND_PUBLIC_URL as string | undefined;
  if (explicit?.trim()) return explicit.replace(/\/$/, "");

  const api = getApiBaseUrl();
  if (api) {
    return api.replace(/\/api\/v\d+$/i, "").replace(/\/api$/i, "") || api;
  }

  if (typeof window !== "undefined") return window.location.origin;
  return "";
};

/** Turn /images/ng.png or localhost:8080/... into backend-absolute URL for PDF renderers. */
export const toAbsoluteBackendImageUrl = (src: string): string => {
  const trimmed = src?.trim() || "";
  if (!trimmed || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.includes("amazonaws.com") || /\.s3\./i.test(trimmed)) return trimmed;

  const backend = getBackendPublicBaseUrl();
  if (!backend) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    if (!trimmed.includes("localhost:8080") && !trimmed.includes("127.0.0.1:8080")) {
      return trimmed;
    }
    const fileName = extractImageFileName(trimmed);
    return fileName ? `${backend}/images/${fileName}` : trimmed;
  }

  const fileName = extractImageFileName(trimmed);
  if (!fileName) return trimmed;

  if (trimmed.startsWith("/images/") || trimmed.startsWith("images/")) {
    return `${backend}/images/${fileName}`;
  }

  if (trimmed.startsWith("/") && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(trimmed)) {
    return `${backend}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
  }

  return trimmed;
};

/**
 * Make template HTML safe for PDF generation:
 * 1) Prefer campus S3 logo URLs when uploaded
 * 2) Remaining local/dev paths → absolute backend /images/... URLs
 */
export const prepareTemplateHtmlForPdf = (
  html: string,
  campusImages: OfferLetterTemplateImage[] = [],
): { html: string; s3Replaced: number; absoluteReplaced: number } => {
  if (!html?.trim()) {
    return { html, s3Replaced: 0, absoluteReplaced: 0 };
  }

  const { html: afterS3, replacedCount: s3Replaced } = rewriteTemplateHtmlImageUrls(html, campusImages);

  const doc = new DOMParser().parseFromString(afterS3, "text/html");
  let absoluteReplaced = 0;

  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (!isLegacyTemplateImageUrl(src)) return;

    const absolute = toAbsoluteBackendImageUrl(src);
    if (absolute && absolute !== src) {
      img.setAttribute("src", absolute);
      absoluteReplaced += 1;
    }
  });

  return { html: doc.body.innerHTML, s3Replaced, absoluteReplaced };
};

export const extractImageFileName = (url: string): string => {
  try {
    const path = url.includes("://") ? new URL(url, window.location.origin).pathname : url.split("?")[0];
    return (path.split("/").pop() || "").toLowerCase();
  } catch {
    return (url.split("/").pop() || "").toLowerCase();
  }
};

export const findS3ImageForLegacyUrl = (
  legacyUrl: string,
  campusImages: OfferLetterTemplateImage[],
): OfferLetterTemplateImage | undefined => {
  if (!campusImages.length) return undefined;

  const fileName = extractImageFileName(legacyUrl);
  const baseName = fileName.replace(/\.[^.]+$/, "");

  const byFile = campusImages.find((img) => {
    const name = (img.image_name || "").toLowerCase();
    const key = (img.s3_key || "").toLowerCase();
    const s3 = (img.s3_url || "").toLowerCase();
    return (
      (fileName && (key.endsWith(fileName) || s3.endsWith(fileName))) ||
      (baseName && (name === baseName || name === fileName))
    );
  });
  if (byFile) return byFile;

  return (
    campusImages.find((img) => img.image_type === "logo") ||
    campusImages.find((img) => (img.image_name || "").toLowerCase().includes("ng"))
  );
};

export const rewriteTemplateHtmlImageUrls = (
  html: string,
  campusImages: OfferLetterTemplateImage[],
): { html: string; replacedCount: number } => {
  if (!html?.trim() || !campusImages.length) {
    return { html, replacedCount: 0 };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  let replacedCount = 0;

  doc.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (!isLegacyTemplateImageUrl(src)) return;

    const match = findS3ImageForLegacyUrl(src, campusImages);
    if (match?.s3_url) {
      img.setAttribute("src", match.s3_url);
      if (!img.getAttribute("alt") && match.image_name) {
        img.setAttribute("alt", match.image_name);
      }
      replacedCount += 1;
    }
  });

  return { html: doc.body.innerHTML, replacedCount };
};
