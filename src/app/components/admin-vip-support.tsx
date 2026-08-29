"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: number;
  user_id: string;
  status: "open" | "closed";
  last_message_at: string;
  created_at: string;
};

type VipProfile = {
  display_name: string | null;
  avatar_url: string | null;
};

type SupportMessage = {
  id: number;
  conversation_id: number;
  sender_id: string;
  sender_type: "user" | "admin";
  message: string;
  created_at: string;
};

export default function AdminVipSupport() {
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [selectedConversation, setSelectedConversation] =
    useState<number | null>(null);

  const [messages, setMessages] = useState<
    SupportMessage[]
  >([]);

  const [profiles, setProfiles] = useState<
    Record<string, VipProfile>
  >({});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const supabase = createClient();

  async function loadConversations() {
    const { data, error } = await supabase
      .from("vip_support_conversations")
      .select(
        "id, user_id, status, last_message_at, created_at",
      )
      .order("last_message_at", {
        ascending: false,
      });

    if (!error) {
      const conversationList =
        (data ?? []) as Conversation[];

      setConversations(conversationList);

      const profileEntries = await Promise.all(
        conversationList.map(async (conversation) => {
       const [
  { data: rawProfile },
  { data: avatar },
] = await Promise.all([
  supabase
    .rpc("get_public_profile", {
      p_profile_id: conversation.user_id,
    })
    .maybeSingle(),

  supabase.rpc("get_public_avatar", {
    p_profile_id: conversation.user_id,
  }),
]);

const profile =
  rawProfile as {
    display_name?: string | null;
  } | null;

          return [
            conversation.user_id,
            {
              display_name:
                profile?.display_name ??
                "LIKHA Member",
              avatar_url:
                (avatar as string | null) ?? null,
            },
          ] as const;
        }),
      );

      setProfiles(
        Object.fromEntries(profileEntries),
      );
    }

    setLoading(false);
  }

  async function loadMessages(
    conversationId: number,
  ) {
    const { data, error } = await supabase
      .from("vip_support_messages")
      .select(
        "id, conversation_id, sender_id, sender_type, message, created_at",
      )
      .eq(
        "conversation_id",
        conversationId,
      )
      .order("created_at", {
        ascending: true,
      });

    if (!error) {
      setMessages(
        (data ?? []) as SupportMessage[],
      );
    }
  }

  useEffect(() => {
    void loadConversations();

    const channel = supabase
      .channel("admin-vip-support")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vip_support_messages",
        },
        (payload) => {
          const newMessage =
            payload.new as SupportMessage;

          if (
            newMessage.conversation_id ===
            selectedConversation
          ) {
            setMessages((current) => {
              if (
                current.some(
                  (item) =>
                    item.id === newMessage.id,
                )
              ) {
                return current;
              }

              return [
                ...current,
                newMessage,
              ];
            });
          }

          void loadConversations();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  async function openConversation(
    conversationId: number,
  ) {
    setSelectedConversation(
      conversationId,
    );

    await loadMessages(
      conversationId,
    );
  }

  async function sendMessage() {
    const trimmed = message.trim();

    if (
      !trimmed ||
      !selectedConversation ||
      sending
    ) {
      return;
    }

    setSending(true);

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();

    if (!user) {
      setSending(false);
      return;
    }

    const { error } = await supabase
      .from("vip_support_messages")
      .insert({
        conversation_id:
          selectedConversation,
        sender_id: user.id,
        sender_type: "admin",
        message: trimmed,
      });

    if (!error) {
      setMessage("");
    }

    setSending(false);
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-xl border border-[#173d32]/15 bg-white p-6">
        <p className="text-sm text-[#173d32]/50">
          Loading VIP Support...
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-[#173d32]/15 bg-white shadow-sm">
      <div className="border-b border-[#173d32]/10 bg-[#173d32] px-6 py-5 text-white">
    

        <h2 className="mt-1 font-serif text-3xl font-semibold">
          VIP Support
        </h2>

        <p className="mt-1 text-sm text-white/60">
          Mga mensahe mula sa LIKHA VIP members.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-serif text-2xl font-semibold">
            Wala pang VIP Support messages.
          </p>

          <p className="mt-2 text-sm text-[#173d32]/50">
            Lalabas dito ang conversation kapag
            may VIP member na nag-message.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[420px] lg:grid-cols-[32%_68%]">
          <aside className="border-b border-[#173d32]/10 lg:border-r lg:border-b-0">
            <div className="border-b border-[#173d32]/10 px-5 py-4">
              <p className="text-sm font-semibold">
                VIP Conversations
              </p>

              <p className="mt-1 text-xs text-[#173d32]/45">
                {conversations.length}{" "}
                {conversations.length === 1
                  ? "conversation"
                  : "conversations"}
              </p>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {conversations.map(
                (conversation) => {
                  const selected =
                    selectedConversation ===
                    conversation.id;

                  const profile =
                    profiles[
                      conversation.user_id
                    ];

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() =>
                        void openConversation(
                          conversation.id,
                        )
                      }
                      className={`w-full border-b border-[#173d32]/10 px-5 py-4 text-left transition ${
                        selected
                          ? "bg-[#e9e1d2]"
                          : "hover:bg-[#f7f2e9]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#173d32] font-serif text-lg text-white">
                            {(
                              profile?.display_name?.[0] ??
                              "V"
                            ).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {profile?.display_name ??
                              "LIKHA Member"}
                          </p>

                          <p className="mt-1 text-xs font-medium text-[#b76449]">
                            VIP Member
                          </p>

                          <Link
                            href={`/profile/${conversation.user_id}`}
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                            className="mt-1 inline-block text-xs font-semibold text-[#173d32] underline underline-offset-2 hover:text-[#b76449]"
                          >
                            View Profile
                          </Link>

                          <p className="mt-1 text-[10px] text-[#b76449]">
                            {conversation.status ===
                            "open"
                              ? "Open"
                              : "Closed"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </aside>

          <div className="flex min-h-[420px] flex-col">
            {!selectedConversation ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <div>
                  <p className="font-serif text-2xl font-semibold">
                    Select a VIP conversation
                  </p>

                  <p className="mt-2 text-sm text-[#173d32]/50">
                    Pili ka ng conversation para
                    mabasa at masagot ang message.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-[#173d32]/10 px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const selected =
                          conversations.find(
                            (conversation) =>
                              conversation.id ===
                              selectedConversation,
                          );

                        const profile =
                          selected
                            ? profiles[
                                selected.user_id
                              ]
                            : null;

                        return (
                          <>
                            {profile?.avatar_url ? (
                              <img
                                src={
                                  profile.avatar_url
                                }
                                alt=""
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173d32] font-serif text-white">
                                {(
                                  profile?.display_name?.[0] ??
                                  "V"
                                ).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <p className="font-semibold">
                                {profile?.display_name ??
                                  "LIKHA Member"}
                              </p>

                              <p className="text-xs text-[#b76449]">
                                VIP Member
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {(() => {
                      const selected =
                        conversations.find(
                          (conversation) =>
                            conversation.id ===
                            selectedConversation,
                        );

                      return selected ? (
                        <Link
                          href={`/profile/${selected.user_id}`}
                          className="text-sm font-semibold text-[#b76449] hover:underline"
                        >
                          View Profile
                        </Link>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto bg-[#f7f2e9] px-6 py-5">
                  {messages.map(
                    (item) => {
                      const isAdmin =
                        item.sender_type ===
                        "admin";

                      const selected =
                        conversations.find(
                          (conversation) =>
                            conversation.id ===
                            item.conversation_id,
                        );

                      const profile =
                        selected
                          ? profiles[
                              selected.user_id
                            ]
                          : null;

                      return (
                        <div
                          key={item.id}
                          className={`flex ${
                            isAdmin
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div className="max-w-[78%]">
                            <p
                              className={`mb-1 text-xs font-semibold ${
                                isAdmin
                                  ? "text-right text-[#173d32]/40"
                                  : "text-[#b76449]"
                              }`}
                            >
                              {isAdmin
                                ? "LIKHA Support"
                                : profile?.display_name ??
                                  "VIP Member"}
                            </p>

                            <div
                              className={
                                isAdmin
                                  ? "rounded-2xl rounded-br-sm bg-[#173d32] px-5 py-3 text-white"
                                  : "rounded-2xl rounded-bl-sm border border-[#173d32]/10 bg-white px-5 py-3"
                              }
                            >
                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {item.message}
                              </p>

                              <time className="mt-2 block text-[10px] opacity-50">
                                {new Date(
                                  item.created_at,
                                ).toLocaleString(
                                  "en-PH",
                                  {
                                    month:
                                      "short",
                                    day: "numeric",
                                    hour:
                                      "numeric",
                                    minute:
                                      "2-digit",
                                  },
                                )}
                              </time>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="border-t border-[#173d32]/10 p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={message}
                      onChange={(event) =>
                        setMessage(
                          event.target.value,
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          void sendMessage();
                        }
                      }}
                      rows={2}
                      maxLength={2000}
                      placeholder="Mag-reply sa VIP member..."
                      className="min-h-[52px] flex-1 resize-none rounded-xl border border-[#173d32]/15 bg-[#f7f2e9] px-4 py-3 text-sm outline-none focus:border-[#b76449]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        void sendMessage()
                      }
                      disabled={
                        sending ||
                        !message.trim()
                      }
                      className="rounded-xl bg-[#b76449] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9f503c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending
                        ? "Sending..."
                        : "Send"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}