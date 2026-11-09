"use client";

import { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  X,
  Link as LinkIcon,
  Sparkles,
  Zap,
} from "lucide-react";

interface ProfilePictureUploaderProps {
  value: string;
  onChange: (url: string, meta?: any) => void;
  onDataChange?: (base64Data: string) => void;
  email?: string;
  name?: string;
  inputName?: string;
  label?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Compresses an image in the browser using HTML5 Canvas to WebP format.
 * Caches the compressed result in browser memory without sending to server until save.
 */
function compressImageInBrowser(file: File): Promise<{
  blob: Blob;
  base64: string;
  originalSize: string;
  compressedSize: string;
  reduction: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 512;
        const width = img.width;
        const height = img.height;

        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        // Center cover-crop
        const scale = Math.max(maxDim / width, maxDim / height);
        const x = (maxDim - width * scale) / 2;
        const y = (maxDim - height * scale) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, x, y, width * scale, height * scale);

        const base64 = canvas.toDataURL("image/webp", 0.82);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("WebP conversion failed"));
              return;
            }
            const origBytes = file.size;
            const compBytes = blob.size;
            const savings = Math.max(0, ((1 - compBytes / origBytes) * 100)).toFixed(1);

            resolve({
              blob,
              base64,
              originalSize: formatBytes(origBytes),
              compressedSize: formatBytes(compBytes),
              reduction: `${savings}%`,
              width: maxDim,
              height: maxDim,
            });
          },
          "image/webp",
          0.82
        );
      };
      img.onerror = () => reject(new Error("Could not load image for compression"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePictureUploader({
  value,
  onChange,
  onDataChange,
  email = "employee@srimatrix.io",
  name = "avatar",
  inputName = "avatarUrl",
  label = "Profile Picture",
  className = "",
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Browser-cached preview & base64 payload
  const [cachedPreview, setCachedPreview] = useState<string | null>(null);
  const [cachedBase64, setCachedBase64] = useState<string>("");
  const [isCachedLocally, setIsCachedLocally] = useState<boolean>(false);

  const [compressionMeta, setCompressionMeta] = useState<{
    originalSize: string;
    compressedSize: string;
    compressionReduction: string;
    dimensions: string;
  } | null>(null);

  // Compute safe target storage path preview
  const safeEmail =
    (email || "user@srimatrix.io").trim().toLowerCase().replace(/[^a-z0-9@._-]/g, "") ||
    "user@srimatrix.io";
  const safeName =
    (name || "avatar")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "avatar";
  const targetStoragePath = `${safeEmail}/${safeName}.webp`;

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (PNG, JPG, WEBP, etc.).");
      return;
    }

    setErrorMsg(null);
    setIsCompressing(true);

    try {
      // 1. Compress in browser using HTML5 Canvas to WebP
      const compressed = await compressImageInBrowser(file);

      // 2. Cache in browser memory (instant client-side preview via object URL)
      const previewUrl = URL.createObjectURL(compressed.blob);
      setCachedPreview(previewUrl);
      setCachedBase64(compressed.base64);
      setIsCachedLocally(true);

      setCompressionMeta({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionReduction: compressed.reduction,
        dimensions: `${compressed.width}x${compressed.height}`,
      });

      // Pass preview and base64 to parent form
      onChange(previewUrl, {
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        reduction: compressed.reduction,
      });

      if (onDataChange) {
        onDataChange(compressed.base64);
      }
    } catch (err: any) {
      console.error("Browser compression error:", err);
      setErrorMsg(err?.message || "Failed to compress image in browser.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    onChange("");
    if (onDataChange) onDataChange("");
    setCachedPreview(null);
    setCachedBase64("");
    setIsCachedLocally(false);
    setCompressionMeta(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const displayAvatar = cachedPreview || value;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden input for URL */}
      <input type="hidden" name={inputName} value={value || ""} />

      {/* Hidden input carrying cached WebP base64 - sent ONLY when account form is submitted */}
      <input type="hidden" name="avatarData" value={cachedBase64 || ""} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? "Hide URL Input" : "Paste Link"}</span>
        </button>
      </div>

      {/* Main Upload Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all p-4 ${
          dragActive
            ? "border-indigo-600 bg-indigo-50/70"
            : displayAvatar
            ? "border-slate-200/90 bg-white"
            : "border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50"
        }`}
      >
        {isCompressing ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2.5 text-center">
            <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-800">Compressing to WebP in Browser...</p>
            <p className="text-[11px] text-slate-500 font-mono">
              Target on save: {targetStoragePath}
            </p>
          </div>
        ) : displayAvatar ? (
          /* Preview state with caching and metadata */
          <div className="space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayAvatar}
                  alt="Profile Avatar Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isCachedLocally ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span>Cached in Browser</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Saved WebP</span>
                    </span>
                  )}
                  <span className="text-[11px] text-slate-500 font-mono truncate">
                    {targetStoragePath}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1">
                  {isCachedLocally
                    ? "Cached locally in browser. Will be stored in database when you click Save."
                    : "Active profile avatar stored in database."}
                </p>

                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Storage Metadata Card */}
            {compressionMeta && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold flex items-center gap-1 text-indigo-700">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>Storage Meta (Compression):</span>
                  </span>
                  <span className="font-black text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-mono">
                    {compressionMeta.compressionReduction} smaller
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                  <span>
                    {compressionMeta.originalSize} &rarr; {compressionMeta.compressedSize} (WebP)
                  </span>
                  <span>Target: {targetStoragePath}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty Drop Zone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center py-5 text-center cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 group-hover:bg-indigo-100 transition-all">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              Click to choose image or drag &amp; drop
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Caches in browser &bull; WebP compressed &bull; Stored on save as{" "}
              <span className="font-mono text-indigo-600 font-semibold">
                {targetStoragePath}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Optional Manual URL input */}
      {showUrlInput && (
        <div className="pt-1 animate-in fade-in slide-in-from-top-1">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => {
              onChange(e.target.value);
              setCachedPreview(null);
              setCachedBase64("");
              setIsCachedLocally(false);
              setCompressionMeta(null);
            }}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:outline-none transition-all font-mono text-slate-800 bg-white"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Or paste a direct image URL if you prefer not to upload a local file.
          </p>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <p className="text-xs font-semibold text-rose-600 mt-1">{errorMsg}</p>
      )}
    </div>
  );
}
