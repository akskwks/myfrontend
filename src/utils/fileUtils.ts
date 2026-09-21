const IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatFileType(fileName: string, mimeType: string) {
  if (mimeType) return mimeType;
  const extension = getFileExtension(fileName);
  return extension ? extension.toUpperCase() : "파일";
}

export function isImageFile(mimeType: string, fileName: string) {
  if (IMAGE_MIME_TYPES.has(mimeType)) return true;
  return IMAGE_EXTENSIONS.has(getFileExtension(fileName));
}

function getFileExtension(fileName: string) {
  if (!fileName.includes(".")) return "";
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}
