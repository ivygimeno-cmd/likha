"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ProjectActionsProps = {
  projectId: number;
  title: string;
  description: string;
  imagePath: string | null;
  imagePath2: string | null;
};

export default function PortfolioProjectActions({
  projectId,
  title,
  description,
  imagePath,
  imagePath2,
}: ProjectActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] =
    useState(description);

  const imageUrl = imagePath
    ? supabase.storage
        .from("portfolio-images")
        .getPublicUrl(imagePath)
        .data.publicUrl
    : null;

  const imageUrl2 = imagePath2
    ? supabase.storage
        .from("portfolio-images")
        .getPublicUrl(imagePath2)
        .data.publicUrl
    : null;

  function openEdit() {
    setEditTitle(title);
    setEditDescription(description);
    setMessage("");
    setErrorMessage("");
    setEditing(true);
  }

  function closeEdit() {
    if (loading) return;

    setEditing(false);
    setMessage("");
    setErrorMessage("");
    setEditTitle(title);
    setEditDescription(description);
  }

  function openDelete() {
    setMessage("");
    setErrorMessage("");
    setDeleting(true);
  }

  function closeDelete() {
    if (loading) return;

    setDeleting(false);
    setErrorMessage("");
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const nextTitle = editTitle.trim();
    const nextDescription = editDescription.trim();

    if (nextTitle.length < 2 || nextTitle.length > 100) {
      setErrorMessage(
        "Ang project title ay dapat 2 hanggang 100 characters.",
      );
      setLoading(false);
      return;
    }

    if (nextDescription.length > 1000) {
      setErrorMessage(
        "Maximum na 1,000 characters ang description.",
      );
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    const user = userData.user;

    if (userError || !user) {
      setErrorMessage(
        "Mag-sign in ulit bago mag-edit ng project.",
      );
      setLoading(false);
      return;
    }

    const {
      data: existingProject,
      error: projectFetchError,
    } = await supabase
      .from("portfolio_projects")
      .select(
        "owner_id, image_path, image_path_2",
      )
      .eq("id", projectId)
      .maybeSingle();

    if (
      projectFetchError ||
      !existingProject ||
      existingProject.owner_id !== user.id
    ) {
      setErrorMessage(
        "Hindi ma-edit ang project na ito.",
      );
      setLoading(false);
      return;
    }

    const formData = new FormData(
      event.currentTarget,
    );

    const imageFiles = formData
      .getAll("images")
      .filter(
        (value): value is File =>
          value instanceof File &&
          value.size > 0,
      );

    if (imageFiles.length > 2) {
      setErrorMessage(
        "Maximum na 2 pictures lang bawat project.",
      );
      setLoading(false);
      return;
    }

    for (const image of imageFiles) {
      if (!allowedFileTypes.includes(image.type)) {
        setErrorMessage(
          "JPEG, PNG, o WebP images lamang.",
        );
        setLoading(false);
        return;
      }

      if (image.size > MAX_FILE_SIZE) {
        setErrorMessage(
          "Maximum na 5 MB bawat picture.",
        );
        setLoading(false);
        return;
      }
    }

    const uploadedPaths: string[] = [];

    for (const image of imageFiles) {
      const extension = fileExtensions[image.type];

      const newImagePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("portfolio-images")
          .upload(
            newImagePath,
            image,
            {
              cacheControl: "3600",
              upsert: false,
            },
          );

      if (uploadError) {
        if (uploadedPaths.length > 0) {
          await supabase.storage
            .from("portfolio-images")
            .remove(uploadedPaths);
        }

        setErrorMessage(uploadError.message);
        setLoading(false);
        return;
      }

      uploadedPaths.push(newImagePath);
    }

    const nextImagePath =
      uploadedPaths[0] ??
      existingProject.image_path ??
      null;

    const nextImagePath2 =
      uploadedPaths.length > 1
        ? uploadedPaths[1]
        : existingProject.image_path_2;

    const { error: updateError } =
      await supabase
        .from("portfolio_projects")
        .update({
          title: nextTitle,
          description: nextDescription,
          image_path: nextImagePath,
          image_path_2: nextImagePath2,
        })
        .eq("id", projectId)
        .eq("owner_id", user.id);

    if (updateError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from("portfolio-images")
          .remove(uploadedPaths);
      }

      setErrorMessage(updateError.message);
      setLoading(false);
      return;
    }

    const oldPathsToRemove: string[] = [];

    if (
      uploadedPaths[0] &&
      existingProject.image_path &&
      uploadedPaths[0] !==
        existingProject.image_path
    ) {
      oldPathsToRemove.push(
        existingProject.image_path,
      );
    }

    if (
      uploadedPaths[1] &&
      existingProject.image_path_2 &&
      uploadedPaths[1] !==
        existingProject.image_path_2
    ) {
      oldPathsToRemove.push(
        existingProject.image_path_2,
      );
    }

    if (oldPathsToRemove.length > 0) {
      await supabase.storage
        .from("portfolio-images")
        .remove(oldPathsToRemove);
    }

    setMessage("Na-update na ang project.");
    setLoading(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const { data: userData, error: userError } =
      await supabase.auth.getUser();

    const user = userData.user;

    if (userError || !user) {
      setErrorMessage(
        "Mag-sign in ulit bago mag-delete ng project.",
      );
      setLoading(false);
      return;
    }

    const {
      data: project,
      error: projectError,
    } = await supabase
      .from("portfolio_projects")
      .select(
        "owner_id, image_path, image_path_2",
      )
      .eq("id", projectId)
      .maybeSingle();

    if (
      projectError ||
      !project ||
      project.owner_id !== user.id
    ) {
      setErrorMessage(
        "Hindi ma-delete ang project na ito.",
      );
      setLoading(false);
      return;
    }

    const { error: deleteError } =
      await supabase
        .from("portfolio_projects")
        .delete()
        .eq("id", projectId)
        .eq("owner_id", user.id);

    if (deleteError) {
      setErrorMessage(deleteError.message);
      setLoading(false);
      return;
    }

    const pathsToRemove = [
      project.image_path,
      project.image_path_2,
    ].filter(
      (path): path is string =>
        Boolean(path),
    );

    if (pathsToRemove.length > 0) {
      await supabase.storage
        .from("portfolio-images")
        .remove(pathsToRemove);
    }

    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openEdit}
          aria-label="Edit project"
          title="Edit project"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#173d32]/15 text-[#173d32]/65 transition hover:border-[#b76449] hover:text-[#b76449]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={openDelete}
          disabled={loading}
          aria-label="Delete project"
          title="Delete project"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200/80 text-red-600 transition hover:border-red-400 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M4 7h16" />
            <path d="M9 7V4h6v3" />
            <path d="M8 11v6" />
            <path d="M12 11v6" />
            <path d="M16 11v6" />
            <path d="M6 7l1 13h10l1-13" />
          </svg>
        </button>

        {message && (
          <p className="text-sm text-[#173d32]">
            {message}
          </p>
        )}

        {errorMessage && !editing && !deleting && (
          <p className="text-sm text-red-700">
            {errorMessage}
          </p>
        )}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d32]/35 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEdit();
            }
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] shadow-[0_20px_60px_rgba(23,61,50,0.18)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#173d32]/10 bg-[#fbf8f1] px-6 py-5">
              <h2 className="font-serif text-3xl font-semibold text-[#173d32]">
                Edit Project
              </h2>

              <button
                type="button"
                onClick={closeEdit}
                disabled={loading}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-[#173d32]/60 transition hover:bg-[#173d32]/8 hover:text-[#173d32] disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-6 p-6"
            >
              <div>
                <label
                  htmlFor={`edit-title-${projectId}`}
                  className="mb-2 block text-sm font-semibold text-[#173d32]"
                >
                  Project title
                </label>

                <input
                  id={`edit-title-${projectId}`}
                  name="title"
                  type="text"
                  value={editTitle}
                  onChange={(event) =>
                    setEditTitle(
                      event.target.value,
                    )
                  }
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-3 text-[#173d32] outline-none focus:border-[#b76449]"
                />
              </div>

              {(imageUrl || imageUrl2) && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-[#173d32]">
                    Current pictures
                  </p>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {imageUrl && (
                      <div className="overflow-hidden rounded-xl border border-[#173d32]/10 bg-white">
                        <div
                          className="aspect-[4/3] bg-[#e9e1d2] bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${imageUrl})`,
                          }}
                        />

                        <div className="border-t border-[#173d32]/10 px-3 py-2 text-xs text-[#173d32]/55">
                          Picture 1
                        </div>
                      </div>
                    )}

                    {imageUrl2 && (
                      <div className="overflow-hidden rounded-xl border border-[#173d32]/10 bg-white">
                        <div
                          className="aspect-[4/3] bg-[#e9e1d2] bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${imageUrl2})`,
                          }}
                        />

                        <div className="border-t border-[#173d32]/10 px-3 py-2 text-xs text-[#173d32]/55">
                          Picture 2
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor={`edit-images-${projectId}`}
                  className="mb-2 block text-sm font-semibold text-[#173d32]"
                >
                  Replace pictures
                </label>

                <input
                  id={`edit-images-${projectId}`}
                  name="images"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#173d32] file:px-4 file:py-2 file:font-semibold file:text-white"
                />

                <p className="mt-2 text-xs leading-5 text-[#173d32]/55">
                  Pumili ng 1 picture para palitan
                  ang first image, o 2 pictures
                  para palitan ang parehong images.
                  Maximum 5 MB bawat picture.
                </p>
              </div>

              <div>
                <label
                  htmlFor={`edit-description-${projectId}`}
                  className="mb-2 block text-sm font-semibold text-[#173d32]"
                >
                  Description
                </label>

                <textarea
                  id={`edit-description-${projectId}`}
                  name="description"
                  value={editDescription}
                  onChange={(event) =>
                    setEditDescription(
                      event.target.value,
                    )
                  }
                  maxLength={1000}
                  rows={6}
                  className="w-full resize-y rounded-lg border border-[#173d32]/20 bg-white px-4 py-3 text-[#173d32] outline-none focus:border-[#b76449]"
                />
              </div>

              {errorMessage && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#173d32]/10 pt-5">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={loading}
                  className="rounded-lg border border-[#173d32]/20 px-5 py-3 text-sm font-semibold text-[#173d32] transition hover:border-[#173d32]/40 disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#173d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245646] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Sini-save..."
                    : "I-save ang changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d32]/35 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDelete();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-6 shadow-[0_20px_60px_rgba(23,61,50,0.18)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-[#173d32]">
                  Delete Project
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#173d32]/65">
                  Sigurado ka bang gusto mong
                  burahin ang{" "}
                  <span className="font-semibold text-[#173d32]">
                    {title}
                  </span>
                  ?
                </p>

                <p className="mt-2 text-sm leading-6 text-[#173d32]/55">
                  Hindi na ito maibabalik pagkatapos
                  ma-delete.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDelete}
                disabled={loading}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-[#173d32]/60 transition hover:bg-[#173d32]/8 hover:text-[#173d32] disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {errorMessage && (
              <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[#173d32]/10 pt-5">
              <button
                type="button"
                onClick={closeDelete}
                disabled={loading}
                className="rounded-lg border border-[#173d32]/20 px-5 py-3 text-sm font-semibold text-[#173d32] transition hover:border-[#173d32]/40 disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Deleting..."
                  : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}