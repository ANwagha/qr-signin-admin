"use client";

import { uid, type Photo, type PhotoKind } from "@/lib/store";

/** Shrink a camera photo to a JPEG data URL small enough for the prototype's browser storage. */
export async function fileToDataUrl(file: File, maxSide = 640, quality = 0.7): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    // Re-encoding drops the file's hidden metadata (EXIF), as planned for stored copies.
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** SHA-256 of the stored image, so any later change is detectable. Needs a secure (https/localhost) page. */
export async function sha256(dataUrl: string): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(dataUrl);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function makePhoto(kind: PhotoKind, label: string, dataUrl: string): Promise<Photo> {
  return { id: uid(), kind, label, dataUrl, capturedAt: new Date().toISOString(), sha256: await sha256(dataUrl) };
}

/** Placeholder image for demo data (we never use real people's photos). */
export function placeholderImage(text: string, bg: string, fg = "#141414") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="54%" font-family="Arial,sans-serif" font-size="${text.length > 3 ? 26 : 96}" font-weight="700" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
