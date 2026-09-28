// src/utils/fileDownload.ts
import client, { tokenStore } from "../api/client";
import env from "../config/env";

/**
 * Resolves a clean API endpoint path without duplicate /api prefixes
 */
export const getCleanApiEndpoint = (rawUrl: string): string => {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const parsed = new URL(rawUrl);
      return parsed.pathname + parsed.search;
    } catch {
      return rawUrl;
    }
  }
  if (rawUrl.startsWith("/api/")) {
    return rawUrl.replace(/^\/api/, "");
  }
  if (!rawUrl.startsWith("/")) {
    return `/${rawUrl}`;
  }
  return rawUrl;
};

/**
 * Builds an authenticated direct download URL with token in query param
 */
export const getDirectDownloadUrl = (rawUrl: string, requestedFilename?: string): string => {
  if (!rawUrl) return "";
  let fullUrl = rawUrl;
  if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
    const baseUrl = env.API_BASE_URL.replace(/\/api\/?$/, "");
    const cleanPath = fullUrl.startsWith("/") ? fullUrl : `/${fullUrl}`;
    fullUrl = `${baseUrl}${cleanPath}`;
  }

  const token = tokenStore.get() || "";
  const sep = fullUrl.includes("?") ? "&" : "?";
  let finalUrl = `${fullUrl}${sep}download=true`;
  if (token) {
    finalUrl += `&token=${encodeURIComponent(token)}`;
  }
  if (requestedFilename) {
    finalUrl += `&filename=${encodeURIComponent(requestedFilename)}`;
  }
  return finalUrl;
};

/**
 * Robustly downloads any file (PDF, documents, images) preserving its proper extension.
 * Never downloads as an HTML error page.
 */
export const downloadFileBlob = async (
  fileUrl: string,
  preferredFileName?: string,
  fallbackExtension: string = ".pdf"
): Promise<boolean> => {
  if (!fileUrl) return false;

  // Resolve safe filename with appropriate extension
  let safeFileName = preferredFileName?.trim() || "";
  if (!safeFileName) {
    const urlParts = fileUrl.split("/");
    safeFileName = urlParts[urlParts.length - 1].split("?")[0] || "downloaded_file";
  }

  // Ensure filename has an extension
  if (!safeFileName.includes(".")) {
    safeFileName = `${safeFileName}${fallbackExtension.startsWith(".") ? fallbackExtension : `.${fallbackExtension}`}`;
  }

  // Case 1: Direct blob: or data: URLs
  if (fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }

  // Case 2: Fetch via authenticated Axios client as binary Blob
  try {
    const endpoint = getCleanApiEndpoint(fileUrl);
    const res = await client.get(endpoint, {
      responseType: "blob",
    });

    const contentType = String(res.headers["content-type"] || "").toLowerCase();

    // Guard: If backend returned an error JSON or HTML page, do NOT download it as HTML
    if (contentType.includes("application/json") || contentType.includes("text/html")) {
      throw new Error("Received non-binary response from server");
    }

    const mime = contentType || "application/octet-stream";
    const blob = new Blob([res.data], { type: mime });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    return true;
  } catch {
    // Case 3: Fallback using direct authenticated URL
    try {
      const directUrl = getDirectDownloadUrl(fileUrl, safeFileName);
      const a = document.createElement("a");
      a.href = directUrl;
      a.download = safeFileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  }
};
