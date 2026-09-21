import { useEffect, useRef, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Paperclip,
  Trash2,
} from "lucide-react";
import { getWorkFileContentUrl, getWorkFileDownloadUrl } from "../api/workApi";
import type { WorkFile } from "../types/workList";
import {
  formatFileSize,
  formatFileType,
  isImageFile,
} from "../utils/fileUtils";

type WorkAttachmentsProps = {
  existingFiles?: WorkFile[];
  pendingFiles?: File[];
  editable: boolean;
  onAddFiles?: (files: File[]) => void;
  onRemoveExisting?: (fileId: number) => void;
  onRemovePending?: (index: number) => void;
};

export function WorkAttachments({
  existingFiles = [],
  pendingFiles = [],
  editable,
  onAddFiles,
  onRemoveExisting,
  onRemovePending,
}: WorkAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isEmpty = existingFiles.length === 0 && pendingFiles.length === 0;

  return (
    <section
      className="work-attachments"
      aria-labelledby="work-attachments-title"
    >
      <div className="work-attachments-heading">
        <div>
          <h3 id="work-attachments-title">첨부파일</h3>
          <span>{existingFiles.length + pendingFiles.length}개</span>
        </div>
        {editable && (
          <>
            <button
              className="secondary-button compact"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              <Paperclip size={16} aria-hidden="true" />
              파일 선택
            </button>
            <input
              ref={inputRef}
              className="work-file-input"
              type="file"
              multiple
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) onAddFiles?.(files);
                event.target.value = "";
              }}
            />
          </>
        )}
      </div>

      {isEmpty ? (
        <p className="work-attachments-empty">
          {editable
            ? "이미지 또는 문서 파일을 여러 개 선택할 수 있습니다."
            : "첨부된 파일이 없습니다."}
        </p>
      ) : (
        <div className="work-file-grid">
          {existingFiles.map((file) => (
            <ExistingFileItem
              key={file.workFileId}
              file={file}
              editable={editable}
              onRemove={() => onRemoveExisting?.(file.workFileId)}
            />
          ))}
          {pendingFiles.map((file, index) => (
            <PendingFileItem
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              file={file}
              onRemove={() => onRemovePending?.(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ExistingFileItem({
  file,
  editable,
  onRemove,
}: {
  file: WorkFile;
  editable: boolean;
  onRemove: () => void;
}) {
  const isImage = isImageFile(file.mimeType, file.orgnFileName);
  const contentUrl = getWorkFileContentUrl(file.workFileId);

  return (
    <article className="work-file-item">
      {isImage ? (
        <a
          className="work-file-thumbnail"
          href={contentUrl}
          target="_blank"
          rel="noreferrer"
          title="원본 이미지 보기"
        >
          <img src={contentUrl} alt={file.orgnFileName} />
        </a>
      ) : (
        <div className="work-file-icon" aria-hidden="true">
          <FileText size={24} />
        </div>
      )}
      <FileMeta
        name={file.orgnFileName}
        size={file.fileSize}
        type={file.mimeType || file.fileExtension}
      />
      <div className="work-file-actions">
        {isImage && (
          <a
            href={contentUrl}
            target="_blank"
            rel="noreferrer"
            title="원본 보기"
            aria-label={`${file.orgnFileName} 원본 보기`}
          >
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        )}
        <a
          href={getWorkFileDownloadUrl(file.workFileId)}
          title="다운로드"
          aria-label={`${file.orgnFileName} 다운로드`}
        >
          <Download size={16} aria-hidden="true" />
        </a>
        {editable && (
          <button
            className="danger-text"
            type="button"
            title="첨부 삭제"
            aria-label={`${file.orgnFileName} 삭제`}
            onClick={onRemove}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}

function PendingFileItem({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const isImage = isImageFile(file.type, file.name);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!isImage) {
      setPreviewUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file, isImage]);

  return (
    <article className="work-file-item is-pending">
      {isImage && previewUrl ? (
        <a
          className="work-file-thumbnail"
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          title="선택한 이미지 미리보기"
        >
          <img src={previewUrl} alt={file.name} />
        </a>
      ) : (
        <div className="work-file-icon" aria-hidden="true">
          <FileText size={24} />
        </div>
      )}
      <FileMeta name={file.name} size={file.size} type={file.type} />
      <div className="work-file-actions">
        <button
          className="danger-text"
          type="button"
          title="선택 취소"
          aria-label={`${file.name} 선택 취소`}
          onClick={onRemove}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function FileMeta({
  name,
  size,
  type,
}: {
  name: string;
  size: number;
  type: string;
}) {
  return (
    <div className="work-file-meta">
      <strong title={name}>{name}</strong>
      <span>
        {formatFileSize(size)} · {formatFileType(name, type)}
      </span>
    </div>
  );
}
