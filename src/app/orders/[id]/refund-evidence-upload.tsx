"use client";

import { useState } from "react";

type Props = {
  onFilesChange?: (files: File[]) => void;
};

export default function RefundEvidenceUpload({
  onFilesChange,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);

  function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selected = Array.from(
      event.target.files ?? [],
    );

    const valid = selected.filter((file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/quicktime",
      ];

      const maxSize = 50 * 1024 * 1024;

      return (
        allowedTypes.includes(file.type) &&
        file.size <= maxSize
      );
    });

    setFiles(valid);
    onFilesChange?.(valid);
  }

  return (
    <div>
      <label className="text-sm font-semibold">
        Photos or videos
      </label>

      <p className="mt-1 text-xs text-[#173d32]/45">
        Add evidence that may help LIKHA review your refund request.
        Maximum 50 MB per file.
      </p>

      <input
        type="file"
        name="evidence"
        multiple
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        onChange={handleFiles}
        className="mt-3 block w-full text-sm"
      />

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="rounded-lg border border-[#173d32]/10 bg-white px-4 py-3"
            >
              <p className="truncate text-sm font-medium">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-[#173d32]/40">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}