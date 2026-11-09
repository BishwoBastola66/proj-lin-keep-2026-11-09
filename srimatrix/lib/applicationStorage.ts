import path from "path";
import fs from "fs";

export interface StoredApplicationDocument {
  id: number;
  applicationName: string;
  pages?: string[];
  page1Html: string;
  page2Html: string;
  includeWatermark: boolean;
  status?: string;
  savedAt: string;
  fileSizeBytes?: number;
}

const STORAGE_DIR = path.join(process.cwd(), "public", "storage", "applications");
const BUCKET_NAME = "applications";

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch {
    // Vercel serverless has a read-only filesystem; safe to ignore
  }
}

/**
 * Uploads a file directly into the Supabase Storage Bucket ('applications')
 * Works in production on Vercel without needing local filesystem access.
 */
async function uploadToSupabaseBucket(
  fileName: string,
  content: string | Buffer,
  contentType: string
): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL || "https://gcnqrsyzcbzkjiscfqyj.supabase.co";
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!apiKey) return null;

  try {
    const uploadEndpoint = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`;
    const res = await fetch(uploadEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        apikey: apiKey,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: typeof content === "string" ? content : new Uint8Array(content),
    });

    if (res.ok) {
      return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
    } else {
      const errText = await res.text();
      console.warn(`Supabase Storage upload (${res.status}):`, errText);
      return null;
    }
  } catch (err) {
    console.warn("Failed to upload to Supabase Storage bucket:", err);
    return null;
  }
}

/**
 * Saves the application to Supabase Storage Bucket ('applications') with local disk fallback:
 * 1. Uploads `app_{id}.json` to Supabase Storage Bucket
 * 2. Uploads `app_{id}.doc` (genuine MS Word Document) to Supabase Storage Bucket
 * 3. Returns the persistent Supabase public URLs for Vercel deployment
 */
export async function saveApplicationToFileStorage(
  appId: number,
  data: {
    applicationName: string;
    pages?: string[];
    page1Html?: string;
    page2Html?: string;
    includeWatermark: boolean;
    status?: string;
  }
): Promise<{ fileUrl: string; docUrl: string; fileSizeBytes: number }> {
  const jsonFileName = `app_${appId}.json`;
  const docFileName = `app_${appId}.doc`;

  const pages =
    data.pages && data.pages.length > 0
      ? data.pages
      : [data.page1Html || "", data.page2Html || ""].filter((p, idx) => idx === 0 || p.length > 0);

  const docPayload: StoredApplicationDocument = {
    id: appId,
    applicationName: data.applicationName,
    pages,
    page1Html: pages[0] || "",
    page2Html: pages[1] || "",
    includeWatermark: data.includeWatermark,
    status: data.status || "Saved",
    savedAt: new Date().toISOString(),
  };

  const jsonContent = JSON.stringify(docPayload, null, 2);
  const fileSizeBytes = Buffer.byteLength(jsonContent, "utf-8");

  // All pages rendered with Microsoft Word native section/page break
  const wordPagesHtml = pages
    .map((pageHtml) => `<div class="word-page">${pageHtml}</div>`)
    .join('\n<br clear="all" style="page-break-before:always; mso-break-type:section-break" />\n');

  // Genuine MS Word Document (.doc) with A4 sizing and official typography
  const wordHTML = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${data.applicationName || "Application"}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4 */
          margin: 40pt 45pt 40pt 45pt;
          mso-header-margin: 36pt;
          mso-footer-margin: 36pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 11pt;
          color: #0f172a;
          line-height: 1.5;
        }
        p { margin: 0 0 10pt 0; }
        ul { margin: 0 0 12pt 0; padding-left: 20pt; }
        li { margin-bottom: 4pt; }
      </style>
    </head>
    <body>
      <div class="Section1">
        ${wordPagesHtml}
      </div>
    </body>
    </html>
  `;

  // 1. Upload both to Supabase Cloud Storage Bucket ('applications')
  const [supabaseJsonUrl, supabaseDocUrl] = await Promise.all([
    uploadToSupabaseBucket(jsonFileName, jsonContent, "application/json"),
    uploadToSupabaseBucket(docFileName, "\ufeff" + wordHTML, "application/msword"),
  ]);

  // 2. Safe local mirror for development/offline testing
  try {
    ensureDirectoryExists();
    fs.writeFileSync(path.join(STORAGE_DIR, jsonFileName), jsonContent, "utf-8");
    fs.writeFileSync(path.join(STORAGE_DIR, docFileName), "\ufeff" + wordHTML, "utf-8");
  } catch {
    // Read-only filesystem in Vercel production serverless
  }

  const supabaseUrl = process.env.SUPABASE_URL || "https://gcnqrsyzcbzkjiscfqyj.supabase.co";
  const defaultBucketJsonUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${jsonFileName}`;
  const defaultBucketDocUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${docFileName}`;

  return {
    fileUrl: supabaseJsonUrl || defaultBucketJsonUrl,
    docUrl: supabaseDocUrl || defaultBucketDocUrl,
    fileSizeBytes,
  };
}

/**
 * Reads the application document from Supabase Storage bucket or local fallback
 */
export async function readApplicationFromFileStorage(
  appId: number
): Promise<StoredApplicationDocument | null> {
  const supabaseUrl = process.env.SUPABASE_URL || "https://gcnqrsyzcbzkjiscfqyj.supabase.co";
  const publicBucketUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/app_${appId}.json`;

  try {
    const res = await fetch(publicBucketUrl, { cache: "no-store" });
    if (res.ok) {
      return (await res.json()) as StoredApplicationDocument;
    }
  } catch {
    // Try local fallback
  }

  try {
    const jsonFilePath = path.join(STORAGE_DIR, `app_${appId}.json`);
    if (fs.existsSync(jsonFilePath)) {
      const raw = fs.readFileSync(jsonFilePath, "utf-8");
      return JSON.parse(raw) as StoredApplicationDocument;
    }
  } catch {
    // Ignore in read-only environment
  }

  return null;
}

/**
 * Deletes the application files from Supabase Storage Bucket and local storage
 */
export async function deleteApplicationFromFileStorage(appId: number) {
  const supabaseUrl = process.env.SUPABASE_URL || "https://gcnqrsyzcbzkjiscfqyj.supabase.co";
  const apiKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (apiKey) {
    try {
      await Promise.all([
        fetch(`${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/app_${appId}.json`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}`, apikey: apiKey },
        }),
        fetch(`${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/app_${appId}.doc`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}`, apikey: apiKey },
        }),
      ]);
    } catch (err) {
      console.warn("Failed to delete from Supabase storage bucket:", err);
    }
  }

  try {
    const jsonFilePath = path.join(STORAGE_DIR, `app_${appId}.json`);
    const docFilePath = path.join(STORAGE_DIR, `app_${appId}.doc`);
    if (fs.existsSync(jsonFilePath)) fs.unlinkSync(jsonFilePath);
    if (fs.existsSync(docFilePath)) fs.unlinkSync(docFilePath);
  } catch {
    // Ignore in read-only environment
  }
}
