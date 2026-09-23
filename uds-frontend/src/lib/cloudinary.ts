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
