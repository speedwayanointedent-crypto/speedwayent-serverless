"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon, Video, GripVertical, Plus, Link2 } from "lucide-react";
import { apiRequest, getApiErrorMessage, UPLOAD_TIMEOUT } from "@/lib/api";

export type GalleryItem = { url: string; type: "image" | "video" };

interface Props {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  label?: string;
  maxItems?: number;
}

export const GalleryUploader: React.FC<Props> = ({ value = [], onChange, label = "Product Gallery", maxItems = 10 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const isVideoUrl = (url: string) =>
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || /youtube\.com|youtu\.be|vimeo\.com/i.test(url);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (value.length >= maxItems) {
        setError(`Maximum ${maxItems} items allowed`);
        return;
      }

      setUploading(true);
      setError(null);
      const newItems: GalleryItem[] = [];

      for (let i = 0; i < files.length && value.length + newItems.length < maxItems; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) {
          setError("Only images and videos are allowed");
          continue;
        }
        if (isVideo && file.size > 50 * 1024 * 1024) {
          setError("Video must be under 50MB");
          continue;
        }
        if (isImage && file.size > 5 * 1024 * 1024) {
          setError("Image must be under 5MB");
          continue;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          const res: any = await apiRequest("/api/products/upload-gallery", {
            method: "POST",
            body: formData,
            timeout: UPLOAD_TIMEOUT,
            skipRetry: true,
          });
          if (res?.url) {
            newItems.push({ url: res.url, type: res.type || (isVideo ? "video" : "image") });
          } else {
            setError("Upload failed - no URL returned");
            break;
          }
        } catch (err) {
          setError(getApiErrorMessage(err) || "Upload failed");
          break;
        }
      }

      if (newItems.length > 0) onChange([...value, ...newItems]);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [value, onChange, maxItems]
  );

  const handleUrlAdd = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (value.length >= maxItems) {
      setError(`Maximum ${maxItems} items allowed`);
      return;
    }
    if (value.some((item) => item.url === url)) {
      setError("This URL is already in the gallery");
      return;
    }
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }
    onChange([...value, { url, type: isVideoUrl(url) ? "video" : "image" }]);
    setUrlInput("");
    setShowUrlInput(false);
    setError(null);
  };

  const removeItem = (index: number) => onChange(value.filter((_, i) => i !== index));

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const items = [...value];
    const [dragged] = items.splice(dragIndex, 1);
    items.splice(index, 0, dragged);
    onChange(items);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-foreground">{label}</label>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || value.length >= maxItems}
          className="btn-outline flex items-center gap-2 text-sm h-9"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload Files"}
        </button>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={value.length >= maxItems}
          className="btn-outline flex items-center gap-2 text-sm h-9"
        >
          <Link2 className="h-4 w-4" />
          Paste URL
        </button>
        <span className="flex items-center text-xs text-muted-foreground">
          {value.length}/{maxItems} items
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {showUrlInput && (
        <div className="flex gap-2 animate-fade-in-down">
          <input
            type="url"
            placeholder="https://example.com/image.jpg or video.mp4"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlAdd())}
            className="form-input flex-1 text-sm"
          />
          <button type="button" onClick={handleUrlAdd} className="btn-primary h-10 px-3 text-sm">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {value.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
                dragIndex === index ? "border-primary shadow-lg shadow-primary/20 scale-105" : "border-border hover:border-primary/50"
              }`}
            >
              {item.type === "video" ? (
                <div className="relative h-full w-full bg-slate-900 flex items-center justify-center">
                  <video src={item.url} className="h-full w-full object-cover" muted playsInline />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Video className="w-5 h-5 text-slate-800" />
                    </div>
                  </div>
                </div>
              ) : (
                <img src={item.url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
              )}

              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded bg-black/50 flex items-center justify-center">
                  <GripVertical className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="absolute bottom-1 left-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    item.type === "video" ? "bg-purple-500 text-white" : "bg-blue-500 text-white"
                  }`}
                >
                  {item.type === "video" ? "VID" : "IMG"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
              >
                <X className="w-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 px-4 cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex items-center gap-3 mb-3">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            <Video className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Drop images or videos here</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Images up to 5MB, videos up to 50MB</p>
        </div>
      )}
    </div>
  );
};
