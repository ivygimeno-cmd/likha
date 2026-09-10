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

export default function PortfolioProjectForm() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const title = String(formData.get("title") ?? "").trim();
    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const imageFiles = formData.getAll("images").filter(
      (value): value is File =>
        value instanceof File && value.size > 0,
    );

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (title.length < 2 || title.length > 100) {
      setErrorMessage(
        "Ang project title ay dapat 2 hanggang 100 characters.",
      );
      setLoading(false);
      return;
    }

    if (description.length > 1000) {
      setErrorMessage(
        "Maximum na 1,000 characters ang description.",
      );
      setLoading(false);
      return;
    }

    if (imageFiles.length === 0) {
      setErrorMessage("Pumili ng kahit isang project picture.");
      setLoading(false);
      return;
    }

    if (imageFiles.length > 2) {
      setErrorMessage("Maximum na 2 pictures lang bawat project.");
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "Mag-sign in ulit bago magdagdag ng project.",
      );
      setLoading(false);
      return;
    }

    const uploadedPaths: string[] = [];

    for (const image of imageFiles) {
      const extension = fileExtensions[image.type];

      const imagePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-images")
        .upload(imagePath, image, {
          cacheControl: "3600",
          upsert: false,
        });

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

      uploadedPaths.push(imagePath);
    }

    const { error: projectError } = await supabase
      .from("portfolio_projects")
      .insert({
        owner_id: user.id,
        title,
        description,
        image_path: uploadedPaths[0],
        image_path_2: uploadedPaths[1] ?? null,
      });

    if (projectError) {
      await supabase.storage
        .from("portfolio-images")
        .remove(uploadedPaths);

      const reachedMaximum = projectError.message.includes(
        "Maximum of 6 portfolio projects allowed",
      );

      setErrorMessage(
        reachedMaximum
          ? "Maximum na 6 projects ang maaaring ilagay."
          : projectError.message,
      );

      setLoading(false);
      return;
    }

    form.reset();
    setMessage(
      "Nagdagdag na ang project sa iyong profile.",
    );
    setLoading(false);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-5 rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] p-6"
    >
      <div>
        <label
          htmlFor="portfolio-title"
          className="mb-2 block text-sm font-semibold"
        >
          Project title
        </label>

        <input
          id="portfolio-title"
          name="title"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="Halimbawa: Custom Wedding Souvenirs"
          className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
        />
      </div>

      <div>
        <label
          htmlFor="portfolio-images"
          className="mb-2 block text-sm font-semibold"
        >
          Project pictures
        </label>

        <input
          id="portfolio-images"
          name="images"
          type="file"
          required
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="w-full rounded-lg border border-[#173d32]/20 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#173d32] file:px-4 file:py-2 file:font-semibold file:text-white"
        />

        <p className="mt-2 text-xs text-[#173d32]/55">
          JPEG, PNG, o WebP. Maximum 2 pictures, 5 MB bawat picture.
        </p>
      </div>

      <div>
        <label
          htmlFor="portfolio-description"
          className="mb-2 block text-sm font-semibold"
        >
          Description
        </label>

        <textarea
          id="portfolio-description"
          name="description"
          rows={4}
          maxLength={1000}
          placeholder="Maikling kuwento tungkol sa project, materials, o proseso..."
          className="w-full resize-y rounded-lg border border-[#173d32]/20 bg-white px-4 py-3 outline-none focus:border-[#b76449]"
        />
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {message && (
        <p className="rounded-lg bg-[#173d32]/10 px-4 py-3 text-sm text-[#173d32]">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#b76449] px-6 py-3 font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Ina-upload..."
          : "Idagdag ang Project"}
      </button>
    </form>
  );
}