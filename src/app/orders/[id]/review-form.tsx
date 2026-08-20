"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";


type ExistingReview = {
  rating: number;
  comment: string | null;
};

type ReviewFormProps = {
  orderId: string;
  revieweeId: string;
  revieweeLabel: string;
  existingReview: ExistingReview | null;
};

export default function ReviewForm({
  orderId,
  revieweeId,
  revieweeLabel,
  existingReview,
}: ReviewFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (rating === 0) {
      setErrorMessage("Pumili ng rating mula 1 hanggang 5 stars.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      order_id: orderId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      const readableError =
        error.code === "23505"
          ? "Nakapagbigay ka na ng review para sa order na ito."
          : error.message;

      setErrorMessage(readableError);
      setLoading(false);
      return;
    }

    setMessage("Salamat! Naipadala na ang iyong review.");
    setLoading(false);
    router.refresh();
  }

  if (existingReview) {
    return (
      <div className="mt-8 border-t border-[#173d32]/15 pt-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
          Your review
        </p>

        <div
          className="mt-3 text-3xl tracking-[0.12em] text-[#b76449]"
          aria-label={`${existingReview.rating} out of 5 stars`}
        >
          {"★".repeat(existingReview.rating)}
          <span className="text-[#173d32]/15">
            {"★".repeat(5 - existingReview.rating)}
          </span>
        </div>

        {existingReview.comment && (
          <p className="mt-4 leading-7 text-[#173d32]/70">
            {existingReview.comment}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 border-t border-[#173d32]/15 pt-7"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b76449]">
        Rate your experience
      </p>

      <h3 className="mt-3 font-serif text-3xl font-semibold">
        Kumusta ang experience mo sa {revieweeLabel}?
      </h3>

      <div
        className="mt-5 flex w-fit gap-2"
        onMouseLeave={() => setHoveredRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoveredRating || rating);

          return (
            <button
              key={star}
              type="button"
              onClick={() => {
                setRating(star);
                setErrorMessage("");
              }}
              onMouseEnter={() => setHoveredRating(star)}
              className={`text-4xl transition ${
                isActive
                  ? "scale-110 text-[#b76449]"
                  : "text-[#173d32]/20"
              }`}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          );
        })}
      </div>

      {rating > 0 && (
        <p className="mt-2 text-sm text-[#173d32]/55">
          {rating} out of 5 stars
        </p>
      )}

      <label
        htmlFor="reviewComment"
        className="mt-6 block text-sm font-semibold"
      >
        Comment <span className="font-normal text-[#173d32]/50">(optional)</span>
      </label>

      <textarea
        id="reviewComment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        rows={5}
        placeholder="Ibahagi ang iyong experience..."
        className="mt-2 w-full resize-none border border-[#173d32]/20 bg-white px-4 py-3.5 outline-none focus:border-[#b76449]"
      />

      <p className="mt-2 text-right text-xs text-[#173d32]/45">
        {comment.length}/1000
      </p>

      {errorMessage && (
        <p className="mt-4 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {message && (
        <p className="mt-4 bg-[#dfe9df] px-4 py-3 text-sm">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="mt-5 bg-[#b76449] px-7 py-4 font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Ipinapadala..." : "Submit Review →"}
      </button>
    </form>
  );
}