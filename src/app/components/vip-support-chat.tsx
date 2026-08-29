"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type SupportMessage = {
  id: number;
  conversation_id: number;
  sender_id: string;
  sender_type: "user" | "admin";
  message: string;
  created_at: string;
};

type VipSupportChatProps = {
  userId: string;
  isVip: boolean;
};

export default function VipSupportChat({
  userId,
  isVip,
}: VipSupportChatProps) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] =
    useState<number | null>(null);

  const [messages, setMessages] =
    useState<SupportMessage[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const supabase = createClient();

  /*
   * Load the VIP support conversation
   * only when the chat is opened.
   */
  useEffect(() => {
    if (!open || !isVip) {
      return;
    }

    async function loadConversation() {
      setLoadingMessages(true);

      const { data: conversation } =
        await supabase
          .from("vip_support_conversations")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

      if (!conversation) {
        setLoadingMessages(false);
        return;
      }

      setConversationId(conversation.id);

      const { data: existingMessages } =
        await supabase
          .from("vip_support_messages")
          .select(
            "id, conversation_id, sender_id, sender_type, message, created_at",
          )
          .eq(
            "conversation_id",
            conversation.id,
          )
          .order("created_at", {
            ascending: true,
          });

      setMessages(
        (existingMessages ??
          []) as SupportMessage[],
      );

      setLoadingMessages(false);
    }

    void loadConversation();
  }, [open, isVip, userId]);

  /*
   * Realtime support messages.
   */
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const channel = supabase
      .channel(
        `vip-support-${conversationId}`,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vip_support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage =
            payload.new as SupportMessage;

          setMessages((current) => {
            if (
              current.some(
                (item) =>
                  item.id ===
                  newMessage.id,
              )
            ) {
              return current;
            }

            return [
              ...current,
              newMessage,
            ];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        channel,
      );
    };
  }, [conversationId]);

  /*
   * Scroll to newest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
   * Close chat when clicking outside.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(
      event: MouseEvent,
    ) {
      const target =
        event.target as Node;

      const chatPanel =
        document.getElementById(
          "likha-vip-support-chat",
        );

      const chatButton =
        document.getElementById(
          "likha-support-button",
        );

      if (
        chatPanel &&
        !chatPanel.contains(target) &&
        chatButton &&
        !chatButton.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [open]);

  async function sendMessage() {
    const trimmedMessage =
      message.trim();

    if (!trimmedMessage || !isVip) {
      return;
    }

    setLoading(true);

    let activeConversationId =
      conversationId;

    if (!activeConversationId) {
      const {
        data: newConversation,
        error,
      } = await supabase
        .from(
          "vip_support_conversations",
        )
        .insert({
          user_id: userId,
        })
        .select("id")
        .single();

      if (
        error ||
        !newConversation
      ) {
        setLoading(false);
        return;
      }

      activeConversationId =
        newConversation.id;

      setConversationId(
        activeConversationId,
      );
    }

    const { error } =
      await supabase
        .from("vip_support_messages")
        .insert({
          conversation_id:
            activeConversationId,
          sender_id: userId,
          sender_type: "user",
          message: trimmedMessage,
        });

    if (!error) {
      setMessage("");
    }

    setLoading(false);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      {!open && (
        <button
          id="likha-support-button"
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-[#173d32] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#245646]"
        >
          Talk to Support
        </button>
      )}

      {open && (
        <div
          id="likha-vip-support-chat"
          className="fixed bottom-6 right-6 z-[60] flex h-[520px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] shadow-2xl"
        >
          <div className="flex items-center justify-between bg-[#173d32] px-5 py-4 text-white">
            <div>
              <p className="font-semibold">
                LIKHA Support
              </p>

              <p className="mt-0.5 text-xs text-white/60">
                {isVip
                  ? "Priority Support"
                  : "VIP Support"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="text-xl text-white/60 hover:text-white"
              aria-label="Isara ang chat"
            >
              ×
            </button>
          </div>

          {!isVip ? (
            <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
              <p className="font-serif text-2xl font-semibold">
                Priority Support
              </p>

              <p className="mt-3 text-sm leading-6 text-[#173d32]/60">
                Ang Priority Support
                ay para sa LIKHA VIP
                members.
              </p>

              <a
                href="/vip"
                className="mt-6 rounded-lg bg-[#173d32] px-6 py-3 text-sm font-semibold text-white hover:bg-[#245646]"
              >
                Mag-upgrade sa VIP
              </a>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-[#f7f2e9] px-4 py-5">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-[#173d32]/45">
                      Nilo-load ang
                      conversation...
                    </p>
                  </div>
                ) : messages.length ===
                  0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="font-serif text-2xl font-semibold">
                      Kumusta!
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#173d32]/55">
                      Paano ka namin
                      matutulungan?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(
                      (item) => {
                        const isOwn =
                          item.sender_id ===
                          userId;

                        return (
                          <div
                            key={
                              item.id
                            }
                            className={`flex ${
                              isOwn
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                                isOwn
                                  ? "rounded-br-sm bg-[#173d32] text-white"
                                  : "rounded-bl-sm border border-[#173d32]/10 bg-white"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {
                                  item.message
                                }
                              </p>

                              <time
                                className={`mt-1 block text-[10px] ${
                                  isOwn
                                    ? "text-right text-white/45"
                                    : "text-[#173d32]/35"
                                }`}
                              >
                                {new Date(
                                  item.created_at,
                                ).toLocaleTimeString(
                                  "en-PH",
                                  {
                                    hour: "numeric",
                                    minute:
                                      "2-digit",
                                  },
                                )}
                              </time>
                            </div>
                          </div>
                        );
                      },
                    )}

                    <div
                      ref={
                        messagesEndRef
                      }
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-[#173d32]/10 bg-[#fbf8f1] p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target
                          .value,
                      )
                    }
                    onKeyDown={
                      handleKeyDown
                    }
                    rows={2}
                    maxLength={2000}
                    placeholder="Isulat ang mensahe..."
                    className="min-h-[48px] flex-1 resize-none rounded-xl border border-[#173d32]/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#b76449]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      void sendMessage()
                    }
                    disabled={
                      loading ||
                      !message.trim()
                    }
                    className="rounded-xl bg-[#b76449] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}