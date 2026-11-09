import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { getCurrentUserAction } from "@/app/actions/auth";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Active session required." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawEmail = (formData.get("email")?.toString() || currentUser.email).trim();
    const rawName = (formData.get("name")?.toString() || currentUser.name).trim();

    const isSuper =
      currentUser.role?.toLowerCase() === "superadmin" ||
      currentUser.position?.toLowerCase().includes("super administrator");
    const isAdmin = isSuper || currentUser.role?.toLowerCase() === "admin";

    // Non-admin users can only update their own avatar
    if (!isAdmin && currentUser.email.toLowerCase() !== rawEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You may only upload an avatar for your own account." },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file was uploaded." },
        { status: 400 }
      );
    }

    // Basic MIME check
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Uploaded file must be a valid image." },
        { status: 400 }
      );
    }

    // Clean and sanitize storage path components: email id / name.webp
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

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Read original metadata with sharp
    const origMeta = await sharp(inputBuffer).metadata();

    // Process & compress to high-efficiency WebP (512x512 cover crop)
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
      originalFormat: origMeta.format || "unknown",
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

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Save compressed WebP and metadata JSON side-by-side
    fs.writeFileSync(targetFilePath, outputBuffer);
    fs.writeFileSync(targetMetaPath, JSON.stringify(storageMeta, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      url: storageMeta.url,
      storagePath: storageMeta.storagePath,
      meta: storageMeta,
    });
  } catch (error: any) {
    console.error("Avatar upload & compression error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to compress and save image.",
      },
      { status: 500 }
    );
  }
}
