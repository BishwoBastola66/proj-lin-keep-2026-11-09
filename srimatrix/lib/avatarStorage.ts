import path from "path";
import fs from "fs";
import sharp from "sharp";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Processes an avatar uploaded in FormData on save:
 * 1. Takes the browser-cached image (File or base64 data URL)
 * 2. Compresses & resizes with sharp to WebP (512x512 cover crop)
 * 3. Saves to public/storage/avatars/[email]/[name].webp
 * 4. Writes [name].meta.json containing storage & compression metadata
 * 5. Returns the static URL /storage/avatars/[email]/[name].webp to store in DB
 */
export async function processAndSaveAvatar(
  formData: FormData,
  rawEmail: string,
  rawName: string
): Promise<string | null> {
  const avatarFile = formData.get("avatarFile") as File | null;
  const avatarData = formData.get("avatarData")?.toString();
  const rawAvatarUrl = formData.get("avatarUrl")?.toString().trim();

  let inputBuffer: Buffer | null = null;
  let originalFormat = "unknown";

  if (avatarFile && typeof avatarFile.arrayBuffer === "function" && avatarFile.size > 0) {
    const arrayBuffer = await avatarFile.arrayBuffer();
    inputBuffer = Buffer.from(arrayBuffer);
    originalFormat = avatarFile.type.replace("image/", "") || "unknown";
  } else if (avatarData && avatarData.startsWith("data:image/")) {
    const parts = avatarData.split(",");
    if (parts.length === 2) {
      inputBuffer = Buffer.from(parts[1], "base64");
      const match = parts[0].match(/data:image\/([a-zA-Z0-9+.-]+);base64/);
      originalFormat = match ? match[1] : "unknown";
    }
  }

  // If no new cached image payload was provided, preserve existing avatarUrl or null
  if (!inputBuffer) {
    return rawAvatarUrl || null;
  }

  try {
    const safeEmail =
      rawEmail.toLowerCase().replace(/[^a-z0-9@._-]/g, "") || "user@srimatrix.io";
    const safeName =
      rawName
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || "avatar";

    const targetDir = path.join(process.cwd(), "public", "storage", "avatars", safeEmail);
    const fileName = `${safeName}.webp`;
    const metaFileName = `${safeName}.meta.json`;

    const targetFilePath = path.join(targetDir, fileName);
    const targetMetaPath = path.join(targetDir, metaFileName);

    const origMeta = await sharp(inputBuffer).metadata();

    const outputBuffer = await sharp(inputBuffer)
      .resize(512, 512, {
        fit: "cover",
        position: "center",
      })
      .webp({
        quality: 82,
        effort: 4,
      })
      .toBuffer();

    const origBytes = inputBuffer.length;
    const compBytes = outputBuffer.length;
    const savingsRatio = Math.max(0, ((1 - compBytes / origBytes) * 100)).toFixed(1);

    const storageMeta = {
      storageBucket: "avatars",
      storagePath: `${safeEmail}/${fileName}`,
      email: safeEmail,
      name: safeName,
      fileName,
      mimeType: "image/webp",
      originalFormat: origMeta.format || originalFormat,
      originalDimensions: `${origMeta.width || 0}x${origMeta.height || 0}`,
      compressedDimensions: "512x512",
      originalSizeBytes: origBytes,
      originalSize: formatBytes(origBytes),
      compressedSizeBytes: compBytes,
      compressedSize: formatBytes(compBytes),
      compressionReduction: `${savingsRatio}%`,
      url: `/storage/avatars/${safeEmail}/${fileName}`,
      uploadedAt: new Date().toISOString(),
    };

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetFilePath, outputBuffer);
    fs.writeFileSync(targetMetaPath, JSON.stringify(storageMeta, null, 2), "utf-8");

    return storageMeta.url;
  } catch (err) {
    console.error("Error processing and saving avatar on account save:", err);
    return rawAvatarUrl || null;
  }
}
