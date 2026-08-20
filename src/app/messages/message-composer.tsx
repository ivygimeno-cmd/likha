"use client";

import type { KeyboardEvent } from "react";
import { useRef } from "react";

type MessageComposerProps = {
  orderId: string;
  sendMessageAction: (formData: FormData) => Promise<void>;
};

export default function MessageComposer({
  orderId,
  sendMessageAction,
}: MessageComposerProps) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      action={sendMessageAction}
      className="border-t border-[#173d32]/10 p-4"
    >
      <input
        type="hidden"
        name="orderId"
        value={orderId}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <textarea
          name="message"
          required
          maxLength={2000}
          rows={2}
          enterKeyHint="send"
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          className="min-h-[52px] flex-1 resize-none rounded-xl border border-[#173d32]/15 bg-[#f7f2e9] px-4 py-3 outline-none focus:border-[#b76449]"
        />

        <button
          type="submit"
          className="h-[52px] rounded-full bg-[#b76449] px-7 font-semibold text-white transition hover:bg-[#9f503c]"
        >
          Send →
        </button>
      </div>

      <p className="mt-2 px-1 text-xs text-[#173d32]/40">
        Press Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}