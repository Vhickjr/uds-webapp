"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  uploadToCloudinary, isCloudinaryConfigured, cld,
  deleteFromCloudinary, publicIdFromUrl,
} from "@/lib/cloudinary";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export const ImageUploadField = ({ value, onChange, folder }: Props) => {
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Removes the old asset from Cloudinary when it is replaced or cleared, so
   * edits do not leave orphans behind. Best-effort: a failed cleanup must not
   * block the content change itself.
   */
  const discard = async (url: string) => {
    const token = session?.access_token;
    if (!token || !publicIdFromUrl(url)) return;
    try {
      await deleteFromCloudinary(url, token);
    } catch (err) {
      console.warn("Cloudinary cleanup failed:", err);
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    const replaced = value;
    try {
      const asset = await uploadToCloudinary(file, folder);
      onChange(asset.url);
      if (replaced) void discard(replaced);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border bg-secondary">
          <Image
            src={cld(value, "f_auto,q_auto,w_400")}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={() => {
              const removed = value;
              onChange("");
              void discard(removed);
            }}
            aria-label="Remove image"
            className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 hover:bg-background"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL, or upload"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading || !isCloudinaryConfigured}
          onClick={() => inputRef.current?.click()}
          title={
            isCloudinaryConfigured
              ? "Upload to Cloudinary"
              : "Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to enable uploads"
          }
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCloudinaryConfigured && (
        <p className="text-xs text-muted-foreground">
          Cloudinary not configured — paste an image URL, or add the env vars to enable uploads.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
};

export default ImageUploadField;
