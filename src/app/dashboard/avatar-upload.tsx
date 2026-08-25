"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AvatarUploadProps = {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string | null;
  editable?: boolean;
  size?: "dashboard" | "profile";
};

export default function AvatarUpload({
  userId,
  currentAvatarUrl,
  displayName,
  editable = false,
  size = "dashboard",
}: AvatarUploadProps) {
  const router = useRouter();

  const [preview, setPreview] = useState(currentAvatarUrl);
  const [editorOpen, setEditorOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  const initial =
    displayName?.trim().charAt(0).toUpperCase() || "L";

const avatarSize =
  size === "profile"
    ? "h-[160px] w-[160px] text-5xl"
    : "h-24 w-24 text-4xl";

  const avatarStyle = preview
    ? {
        backgroundImage: `url(${preview})`,
      }
    : undefined;

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setHasError(true);
      setMessage(
        "JPG, PNG, o WebP image lamang ang puwede.",
      );
      input.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setHasError(true);
      setMessage("Maximum file size ay 2 MB.");
      input.value = "";
      return;
    }

    const previousPreview = preview;
    const localPreview = URL.createObjectURL(file);

    setPreview(localPreview);
    setUploading(true);
    setMessage("");
    setHasError(false);

    try {
      const supabase = createClient();
      const filePath = `${userId}/avatar`;

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: "3600",
          });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

      const avatarUrl =
        `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        throw new Error(profileError.message);
      }

      setPreview(avatarUrl);
      setMessage("Profile picture updated.");
      router.refresh();
    } catch (error) {
      setPreview(previousPreview);
      setHasError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Hindi ma-upload ang profile picture.",
      );
    } finally {
      URL.revokeObjectURL(localPreview);
      setUploading(false);
      input.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {editable ? (
        <button
          type="button"
          onClick={() => setEditorOpen((current) => !current)}
          disabled={uploading}
          aria-expanded={editorOpen}
          aria-label="Edit profile picture"
          className={`group relative flex ${avatarSize} shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#173d32]/15 bg-[#e9e1d2] bg-cover bg-center font-serif font-semibold outline-none transition hover:border-[#b76449] focus-visible:ring-2 focus-visible:ring-[#b76449] focus-visible:ring-offset-2`}
          style={avatarStyle}
        >
          {!preview && initial}

          <span className="absolute inset-x-0 bottom-0 bg-[#173d32]/85 py-2 font-sans text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            Edit photo
          </span>
        </button>
      ) : (
        <div
          role="img"
          aria-label={`${displayName ?? "User"} profile picture`}
          className={`flex ${avatarSize} shrink-0 items-center justify-center rounded-full border border-[#173d32]/15 bg-[#e9e1d2] bg-cover bg-center font-serif font-semibold`}
          style={avatarStyle}
        >
          {!preview && initial}
        </div>
      )}

      {editable && editorOpen && (
        <div className="rounded-xl border border-[#173d32]/15 bg-[#fbf8f1] p-4">
          <label
            className={`inline-flex cursor-pointer items-center rounded-lg bg-[#b76449] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f503c] ${
              uploading
                ? "pointer-events-none opacity-60"
                : ""
            }`}
          >
            {uploading
              ? "Uploading..."
              : preview
                ? "Change Photo"
                : "Upload Photo"}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>

          <p className="mt-2 text-xs text-[#173d32]/50">
            JPG, PNG, or WebP. Maximum 2 MB.
          </p>

          {message && (
            <p
              className={`mt-2 text-sm ${
                hasError
                  ? "text-red-700"
                  : "text-[#b76449]"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}