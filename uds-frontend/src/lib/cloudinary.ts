/**
 * Cloudinary unsigned uploads.
 *
 * Unsigned presets keep the API secret off the client entirely — the browser
 * can only create assets the preset allows, and cannot delete or list.
 * Create one at: Settings -> Upload -> Upload presets -> Signing mode: Unsigned.
 */

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export interface UploadedAsset {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  resourceType: string;
}

export class CloudinaryError extends Error {}

/** Uploads a file and resolves with its delivery URL. */
export const uploadToCloudinary = async (
  file: File,
  folder = "uds-website"
): Promise<UploadedAsset> => {
  if (!isCloudinaryConfigured) {
    throw new CloudinaryError(
      "Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset!);
  body.append("folder", folder);

  // `auto` lets the same endpoint take images and video.
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: "POST", body }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } } | null)?.error?.message ??
      `Upload failed (HTTP ${res.status})`;
    throw new CloudinaryError(message);
  }

  const asset = data as {
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
    resource_type: string;
  };

  return {
    url: asset.secure_url,
    publicId: asset.public_id,
    width: asset.width,
    height: asset.height,
    resourceType: asset.resource_type,
  };
};

/**
 * Inserts Cloudinary transformations into a delivery URL — `f_auto,q_auto`
 * alone typically cuts image weight substantially versus serving the original.
 */
export const cld = (url: string, transform = "f_auto,q_auto"): string => {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
};

/**
 * Extracts the Cloudinary public_id from a delivery URL, so an asset can be
 * deleted without storing its id separately.
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/v1790222204/uds-website/abc.png
 *                                                              ^^^^^^^^^^^^^^^^^^ -> "uds-website/abc"
 *
 * Any transformation segment between /upload/ and the version is dropped, and
 * the trailing extension is removed. Returns null for non-Cloudinary URLs.
 */
export const publicIdFromUrl = (url: string): string | null => {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return null;

  let path = url.split("/upload/")[1];
  if (!path) return null;

  // Drop a leading transformation segment (contains "_", e.g. f_auto,q_auto,w_400).
  const segments = path.split("/");
  if (segments.length > 1 && /(^|,)[a-z]{1,3}_/.test(segments[0])) segments.shift();

  // Drop the version segment (v1234567890).
  if (/^v\d+$/.test(segments[0])) segments.shift();

  path = segments.join("/");
  if (!path) return null;

  return path.replace(/\.[^./]+$/, "");
};

/**
 * Deletes an asset. Routed through the `cloudinary-admin` Edge Function because
 * destroying requires the API secret, which must stay server-side; the function
 * also re-checks that the caller is an admin.
 */
export const deleteFromCloudinary = async (
  url: string,
  accessToken: string
): Promise<void> => {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return; // not a Cloudinary asset — nothing to clean up

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new CloudinaryError("Supabase URL is not configured");

  const res = await fetch(`${base}/functions/v1/cloudinary-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action: "delete", publicId }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new CloudinaryError(
      (data as { error?: string } | null)?.error ?? `Delete failed (HTTP ${res.status})`
    );
  }
};
