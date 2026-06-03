"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { apiRequest, getApiErrorMessage, UPLOAD_TIMEOUT } from "@/lib/api";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  endpoint: string;
  label?: string;
  previewSize?: "sm" | "md" | "lg";
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  endpoint,
  label = "Upload Image",
  previewSize = "md",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = { sm: "aspect-square max-w-24", md: "aspect-video max-w-64", lg: "aspect-video w-full" };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    if (uploading) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res: any = await apiRequest(endpoint, {
        method: "POST",
        body: formData,
        timeout: UPLOAD_TIMEOUT,
        skipRetry: true,
      });
      if (res?.url) onChange(res.url);
      else setError("Upload failed - no URL returned");
    } catch (err) {
      setError(getApiErrorMessage(err) || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {label && <label className="mb-2 block text-sm font-medium">{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Choose File
          </button>
          <span className="flex items-center text-sm text-muted-foreground">or paste URL</span>
        </div>
        <input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value?.startsWith("http") ? value : ""}
          onChange={(e) => {
            setError(null);
            onChange(e.target.value);
          }}
          className="form-input text-sm"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value && (
        <div className={`relative overflow-hidden rounded-lg border border-border ${sizeClasses[previewSize]}`}>
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!value && (
        <div
          className={`flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 ${sizeClasses[previewSize]}`}
        >
          <div className="text-center text-muted-foreground">
            <ImageIcon className="mx-auto h-8 w-8" />
            <p className="mt-2 text-xs">No image</p>
          </div>
        </div>
      )}
    </div>
  );
};
