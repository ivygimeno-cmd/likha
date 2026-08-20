import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealtimeMessageThread from "./realtime-message-thread";
import MessageComposer from "./message-composer";

type PageProps = {
  searchParams: Promise<{
    order?: string;
    error?: string;
  }>;
};

type Conversation = {
  order_id: string;
  project_title: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar_url: string | null;
  order_status: string;
  latest_message: string | null;
  latest_message_at: string | null;
  conversation_updated_at: string;
};

type OrderMessage = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default async function MessagesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  const {
  data: moderationStatusData,
  error: moderationStatusError,
} = await supabase
  .rpc("get_my_chat_moderation_status")
  .maybeSingle();

if (moderationStatusError) {
  throw new Error(
    `Hindi ma-check ang messaging status: ${moderationStatusError.message}`,
  );
}


const moderationStatus = moderationStatusData as {
  warning_count: number;
  acknowledged_warning_count: number;
  chat_locked: boolean;
  chat_locked_at: string | null;
  chat_lock_reason: string | null;
} | null;

const {
  data: activeWarningData,
  error: activeWarningError,
} = await supabase
  .rpc("get_my_active_moderation_warning")
  .maybeSingle();

if (activeWarningError) {
  throw new Error(
    `Hindi ma-load ang active warning: ${activeWarningError.message}`,
  );
}

const activeWarning = activeWarningData as {
  id: string;
  warning_number: number;
  title: string;
  message: string;
  acknowledged_at: string | null;
} | null;

if (
  moderationStatus?.chat_locked === true &&
  moderationStatus?.chat_lock_reason === "final_warning"
) {
  
  
  return (
<main className="flex h-screen flex-col overflow-hidden bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-semibold hover:text-[#b76449]"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      <div className="mx-auto flex max-w-3xl px-6 py-20 lg:px-10">
        <section className="w-full overflow-hidden rounded-2xl border border-[#173d32]/15 bg-[#fbf8f1] shadow-sm">
          <div className="border-b border-[#173d32]/10 bg-[#173d32] px-8 py-7 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9c6a5]">
              Account Notice
            </p>

            <h1 className="mt-3 font-serif text-4xl font-semibold">
              Messaging access restricted
            </h1>
          </div>

          <div className="p-8">
            <p className="text-lg leading-8 text-[#173d32]/75">
              Your messaging access has been restricted after repeated
              violations of LIKHA&apos;s communication policy.
            </p>

            <div className="mt-7 rounded-xl border border-[#b76449]/20 bg-[#b76449]/5 p-5">
              <p className="font-semibold">
                What does this mean?
              </p>

              <p className="mt-2 text-sm leading-6 text-[#173d32]/65">
                You can continue accessing your LIKHA account and
                existing orders, but you cannot send messages while
                this restriction is active.
              </p>
            </div>

            <dl className="mt-7 divide-y divide-[#173d32]/10 border-y border-[#173d32]/10">
              <div className="flex items-center justify-between gap-5 py-4">
                <dt className="text-sm text-[#173d32]/55">
                  Policy warnings
                </dt>

                <dd className="font-semibold">
                  {moderationStatus.warning_count}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-5 py-4">
                <dt className="text-sm text-[#173d32]/55">
                  Acknowledged warnings
                </dt>

                <dd className="font-semibold">
                  {moderationStatus.acknowledged_warning_count}
                </dd>
              </div>

              <div className="flex items-center justify-between gap-5 py-4">
                <dt className="text-sm text-[#173d32]/55">
                  Messaging status
                </dt>

                <dd className="font-semibold text-[#b76449]">
                  Restricted
                </dd>
              </div>
            </dl>

  <p className="mt-7 text-sm leading-6 text-[#173d32]/55">
  Your messaging access is currently locked after repeated policy violations.
  You can submit a support ticket if you believe this restriction was applied
  incorrectly. LIKHA Support will review your request within 12–24 hours.
</p>

<Link
  href="/support/new"
  className="mt-5 inline-flex rounded-xl bg-[#b76449] px-6 py-3 font-semibold text-white transition hover:bg-[#9f503c]"
>
 Request Account Review →
</Link>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg bg-[#173d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b76449]"
              >
                Back to Dashboard
              </Link>

              <Link
                href="/orders"
                className="rounded-lg border border-[#173d32]/20 px-6 py-3 text-sm font-semibold transition hover:border-[#173d32]/40"
              >
                View Orders
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

  const { data: conversationData } = await supabase.rpc(
    "get_message_conversations",
  );

  const conversations =
    (conversationData ?? []) as Conversation[];

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.order_id === params.order,
    ) ??
    conversations[0] ??
    null;

  let orderMessages: OrderMessage[] = [];

  if (selectedConversation) {
    const { data } = await supabase
      .from("order_messages")
      .select("id, sender_id, message, created_at")
      .eq("order_id", selectedConversation.order_id)
      .order("created_at", { ascending: true });

    orderMessages = (data ?? []) as OrderMessage[];
  }

  async function sendMessage(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const orderId = String(
      formData.get("orderId") ?? "",
    );

    const message = String(
      formData.get("message") ?? "",
    ).trim();

    const messagePage = `/messages?order=${encodeURIComponent(
      orderId,
    )}`;

    if (!orderId || !message || message.length > 2000) {
      redirect(
        `${messagePage}&error=${encodeURIComponent(
          "Ang message ay dapat may 1 hanggang 2,000 characters.",
        )}`,
      );
    }
type ModerationDetection = {
  type:
    | "email_detected"
    | "phone_detected"
    | "social_media_detected"
    | "external_payment_detected"
    | "external_link_detected"
    | "other_contact_detected";
  platform?: string;
};

function detectModerationViolation(
  value: string,
): ModerationDetection | null {
  const normalized = value.toLowerCase();

  const compactNormalized = normalized
  .normalize("NFKC")
  .replace(/[^a-z0-9]/g, "");

// Detect disguised / obfuscated social-media references.
// Examples:
// F B
// F.B.
// F A C E B O O K
// F-A-C-E-B-O-O-K
// face book
// blue app

const disguisedSocialPatterns: {
  platform: string;
  patterns: RegExp[];
}[] = [
  {
    platform: "facebook",
    patterns: [
      /\bf[\s._-]*b\b/i,
      /\bf[\s._-]*a[\s._-]*c[\s._-]*e[\s._-]*b[\s._-]*o[\s._-]*o[\s._-]*k\b/i,
      /\bface[\s._-]*book\b/i,
      /\bblue[\s_-]*(?:app|site|platform|social)\b/i,
    ],
  },
  {
    platform: "messenger",
    patterns: [
      /\bm[\s._-]*e[\s._-]*s[\s._-]*s[\s._-]*e[\s._-]*n[\s._-]*g[\s._-]*e[\s._-]*r\b/i,
      /\bmsg[\s_-]*app\b/i,
    ],
  },
  {
    platform: "instagram",
    patterns: [
      /\bi[\s._-]*g\b/i,
      /\bi[\s._-]*n[\s._-]*s[\s._-]*t[\s._-]*a[\s._-]*g[\s._-]*r[\s._-]*a[\s._-]*m\b/i,
      /\binsta[\s._-]*gram\b/i,
      /\bphoto[\s_-]*app\b/i,
    ],
  },
  {
    platform: "tiktok",
    patterns: [
      /\btik[\s._-]*tok\b/i,
      /\bt[\s._-]*i[\s._-]*k[\s._-]*t[\s._-]*o[\s._-]*k\b/i,
    ],
  },
  {
    platform: "telegram",
    patterns: [
      /\btele[\s._-]*gram\b/i,
      /\bt[\s._-]*e[\s._-]*l[\s._-]*e[\s._-]*g[\s._-]*r[\s._-]*a[\s._-]*m\b/i,
    ],
  },
  {
    platform: "whatsapp",
    patterns: [
      /\bwhats[\s._-]*app\b/i,
      /\bw[\s._-]*h[\s._-]*a[\s._-]*t[\s._-]*s[\s._-]*a[\s._-]*p[\s._-]*p\b/i,
    ],
  },
  {
    platform: "viber",
    patterns: [
      /\bv[\s._-]*i[\s._-]*b[\s._-]*e[\s._-]*r\b/i,
    ],
  },
  {
    platform: "discord",
    patterns: [
      /\bd[\s._-]*i[\s._-]*s[\s._-]*c[\s._-]*o[\s._-]*r[\s._-]*d\b/i,
    ],
  },
];

for (const social of disguisedSocialPatterns) {
  if (
    social.patterns.some((pattern) =>
      pattern.test(normalized),
    )
  ) {
    return {
      type: "social_media_detected",
      platform: social.platform,
    };
  }
}

  // Email addresses:
  // name@gmail.com
  // name at gmail dot com
  const emailPattern =
    /\b[a-z0-9._%+-]+\s*(?:@|\(at\)|\[at\]|\sat\s)\s*[a-z0-9.-]+\s*(?:\.|\(dot\)|\[dot\]|\sdot\s)\s*[a-z]{2,}\b/i;

  if (emailPattern.test(value)) {
    return {
      type: "email_detected",
    };
  }

  // Phone/mobile numbers with spaces, dashes, parentheses, etc.
  const phonePattern =
    /(?:^|[^\d])(?:\+?\d[\s().-]*){7,15}(?:$|[^\d])/;

  if (phonePattern.test(value)) {
    return {
      type: "phone_detected",
    };
  }

  const socialPlatforms: {
    platform: string;
    pattern: RegExp;
  }[] = [
    {
      platform: "facebook",
      pattern:
        /\b(?:facebook|face\s*book|fb|facebook\.com)\b/i,
    },
    {
      platform: "messenger",
      pattern:
        /\b(?:messenger|m\.me|fb\s*messenger)\b/i,
    },
    {
      platform: "instagram",
      pattern:
        /\b(?:instagram|insta\s*gram|ig|instagram\.com)\b/i,
    },
    {
      platform: "tiktok",
      pattern:
        /\b(?:tiktok|tik\s*tok|tiktok\.com)\b/i,
    },
    {
      platform: "telegram",
      pattern:
        /\b(?:telegram|tele\s*gram|t\.me)\b/i,
    },
    {
      platform: "whatsapp",
      pattern:
        /\b(?:whatsapp|whats\s*app|wa\.me)\b/i,
    },
    {
      platform: "viber",
      pattern: /\bviber\b/i,
    },
    {
      platform: "discord",
      pattern:
        /\b(?:discord|discord\.gg|discord\.com)\b/i,
    },
    {
      platform: "x",
      pattern:
        /\b(?:twitter|x\.com|twitter\.com)\b/i,
    },
    {
      platform: "linkedin",
      pattern:
        /\b(?:linkedin|linked\s*in|linkedin\.com)\b/i,
    },
    {
      platform: "snapchat",
      pattern:
        /\b(?:snapchat|snap\s*chat)\b/i,
    },
    {
      platform: "wechat",
      pattern:
        /\b(?:wechat|we\s*chat)\b/i,
    },
    {
      platform: "line",
      pattern:
        /\b(?:line\s+app|line\.me)\b/i,
    },
    {
      platform: "skype",
      pattern: /\bskype\b/i,
    },
    {
      platform: "youtube",
      pattern:
        /\b(?:youtube|youtu\.be|youtube\.com)\b/i,
    },
  ];

  for (const social of socialPlatforms) {
    if (social.pattern.test(normalized)) {
      return {
        type: "social_media_detected",
        platform: social.platform,
      };
    }
  }

  // @username style handles
  const socialHandlePattern =
    /(?:^|\s)@[a-z0-9_.]{3,}\b/i;

  if (socialHandlePattern.test(value)) {
    return {
      type: "social_media_detected",
      platform: "other",
    };
  }

  // Off-platform payment methods
  const paymentPattern =
    /\b(?:gcash|g-cash|paymaya|pay\s*maya|maya\s+(?:wallet|payment)|paypal|payoneer|wise|bank\s*transfer|cash\s*app|venmo|western\s*union|crypto(?:currency)?|bitcoin|btc|usdt|ethereum|eth)\b/i;

  if (paymentPattern.test(value)) {
    return {
      type: "external_payment_detected",
    };
  }

  // Explicit off-platform transaction attempts
  const offPlatformPattern =
    /\b(?:outside\s+(?:likha|the\s+platform)|off[-\s]?platform|direct(?:ly)?\s+(?:deal|transaction|payment)|transact\s+(?:outside|directly)|bayad\s+(?:direct|direkta)|direct\s+payment)\b/i;

  if (offPlatformPattern.test(value)) {
    return {
      type: "external_payment_detected",
    };
  }

  // External websites / links
  const externalLinkPattern =
    /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|net|org|ph|io|me|co|app|xyz|site|online)\b)/i;

  if (externalLinkPattern.test(value)) {
    return {
      type: "external_link_detected",
    };
  }

  // General attempts to move communication outside LIKHA
  const otherContactPatterns: RegExp[] = [
    /\b(?:call|text|sms|email|e-mail)\s+(?:me|us|ako|kami)\b/i,

    /\b(?:message|chat|contact|pm|dm)\s+(?:me|us|ako|kami)\s+(?:on|at|via|outside|sa)\b/i,

    /\b(?:send|bigay|ibigay|drop)\s+(?:mo|your)?\s*(?:number|contact|email|username|handle)\b/i,

    /\b(?:contact\s+details|phone\s+number|mobile\s+number)\b/i,
  ];

  if (
    otherContactPatterns.some((pattern) =>
      pattern.test(value),
    )
  ) {
    return {
      type: "other_contact_detected",
    };
  }

  return null;
}

const moderationDetection =
  detectModerationViolation(message);

if (moderationDetection) {
  const {
    error: moderationLogError,
  } = await supabase.rpc(
    "record_moderation_event",
    {
      p_order_id: orderId,
      p_violation_type:
        moderationDetection.type,
      p_platform:
        moderationDetection.platform ?? null,
      p_attempted_message: message,
    },
  );

  if (moderationLogError) {
    console.error(
      "Failed to record moderation event:",
      moderationLogError,
    );
  }

  redirect(
    `${messagePage}&error=${encodeURIComponent(
      "For your safety, keep all communication and transactions inside LIKHA. Contact details, external links, social media, and off-platform payment methods are not allowed.",
    )}`,
  );
}
    const { error } = await supabase
      .from("order_messages")
      .insert({
        order_id: orderId,
        sender_id: user.id,
        message,
      });

    if (error) {
      redirect(
        `${messagePage}&error=${encodeURIComponent(
          error.message,
        )}`,
      );
    }

    redirect(messagePage);
  }
  
async function acknowledgeWarning(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const warningId = String(
    formData.get("warningId") ?? "",
  );

  if (!warningId) {
    redirect("/messages");
  }

  const { error } = await supabase.rpc(
    "acknowledge_moderation_warning",
    {
      p_warning_id: warningId,
    },
  );

  if (error) {
    throw new Error(
      `Hindi ma-acknowledge ang warning: ${error.message}`,
    );
  }

  const orderId = String(
    formData.get("orderId") ?? "",
  );

  if (orderId) {
    redirect(
      `/messages?order=${encodeURIComponent(orderId)}`,
    );
  }

  redirect("/messages");
}

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/15">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="font-serif text-3xl font-semibold tracking-[0.2em]"
          >
            LIKHA
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/orders"
              className="text-sm font-semibold hover:text-[#b76449]"
            >
              Orders
            </Link>

            <Link
              href="/dashboard"
              className="text-sm font-semibold hover:text-[#b76449]"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

 <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 px-6 py-6 lg:px-10">

 
        {conversations.length === 0 ? (
          <div className="mt-10 border-y border-[#173d32]/15 py-20 text-center">
            <p className="font-serif text-3xl font-semibold">
              Wala ka pang conversations.
            </p>

            <p className="mt-3 text-[#173d32]/55">
              Lalabas dito ang messages para sa iyong orders.
            </p>
          </div>
        ) : (

<div className="grid min-h-0 w-full flex-1 overflow-hidden rounded-xl border border-[#173d32]/15 bg-white shadow-sm lg:grid-cols-[30%_70%]">
          
   <aside className="flex min-h-0 flex-col overflow-hidden border-b border-[#173d32]/15 lg:border-r lg:border-b-0">
    <div className="border-b border-[#173d32]/10 px-6 py-5">
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
    Likha Inbox
  </p>

  <h1 className="mt-1 font-serif text-3xl font-semibold">
    Messages
  </h1>

  <div className="mt-4 flex items-center justify-between">
    <p className="text-sm font-semibold">
      Conversations
    </p>

    <p className="text-xs text-[#173d32]/45">
      {conversations.length}{" "}
      {conversations.length === 1
        ? "order"
        : "orders"}
    </p>
  </div>
</div>

     <div className="min-h-0 flex-1 overflow-y-auto">
                {conversations.map((conversation) => {
                  const isSelected =
                    selectedConversation?.order_id ===
                    conversation.order_id;

                  return (
                    <Link
                      key={conversation.order_id}
                      href={`/messages?order=${conversation.order_id}`}
                      className={`flex gap-3 border-b border-[#173d32]/10 px-5 py-4 transition ${
                        isSelected
                          ? "bg-[#e9e1d2]"
                          : "hover:bg-[#f7f2e9]"
                      }`}
                    >
                      <div
                        role="img"
                        aria-label={`${conversation.other_user_name} profile picture`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#173d32]/10 bg-cover bg-center font-serif text-xl font-semibold"
                        style={
                          conversation.other_user_avatar_url
                            ? {
                                backgroundImage: `url(${conversation.other_user_avatar_url})`,
                              }
                            : undefined
                        }
                      >
                        {!conversation.other_user_avatar_url &&
                          conversation.other_user_name
                            .charAt(0)
                            .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold">
                            {conversation.other_user_name}
                          </p>

                          {conversation.latest_message_at && (
                            <time className="shrink-0 text-[10px] text-[#173d32]/40">
                              {new Date(
                                conversation.latest_message_at,
                              ).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs font-semibold text-[#b76449]">
                          {conversation.project_title}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#173d32]/45">
                          {conversation.latest_message ??
                            "No messages yet"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>

            {selectedConversation && (
  <section className="flex min-h-0 overflow-hidden flex-col">
    <div className="flex items-center justify-between gap-5 border-b border-[#173d32]/10 px-6 py-4">
     <div className="flex min-w-0 items-center gap-3">
         <div
       role="img"
     aria-label={`${selectedConversation.other_user_name} profile picture`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#173d32]/10 bg-cover bg-center font-serif text-lg font-semibold"
                      style={
         selectedConversation.other_user_avatar_url
             ? {
              backgroundImage: `url(${selectedConversation.other_user_avatar_url})`,
                           }
               : undefined
               }
                    >
               {!selectedConversation.other_user_avatar_url &&
            selectedConversation.other_user_name
                          .charAt(0)
                          .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {selectedConversation.other_user_name}
                      </p>

                      <p className="truncate text-xs text-[#173d32]/45">
                        {selectedConversation.project_title}
                      </p>
                    </div>
                  </div>
                  

                  <Link
                    href={`/profile/${selectedConversation.other_user_id}`}
                    className="shrink-0 text-sm font-semibold text-[#b76449] hover:text-[#9f503c]"
                  >
                    View Profile →
                  </Link>
                </div>
       
{activeWarning && activeWarning.warning_number <= 2 && (
  <section
    className={`mt-6 rounded-2xl border p-5 ${
      activeWarning.warning_number === 2
        ? "border-[#b76449]/30 bg-[#b76449]/10"
        : "border-[#173d32]/15 bg-[#fbf8f1]"
    }`}
  >
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b76449]">
      Account Policy Notice
    </p>

    <h2 className="mt-2 font-serif text-2xl font-semibold">
      {activeWarning.warning_number === 1
        ? "First Warning"
        : "Second Warning"}
    </h2>

    <p className="mt-3 text-sm leading-6 text-[#173d32]/70">
      {activeWarning.message}
    </p>

    {activeWarning.warning_number === 2 && (
      <p className="mt-3 text-sm font-semibold text-[#9f503c]">
        Messaging is temporarily restricted until you acknowledge this warning.
      </p>
    )}

    <form action={acknowledgeWarning} className="mt-4">
      <input
        type="hidden"
        name="warningId"
        value={activeWarning.id}
      />

      <input
        type="hidden"
        name="orderId"
        value={selectedConversation?.order_id ?? ""}
      />

      <button
        type="submit"
        className="rounded-xl bg-[#173d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245646]"
      >
        I Understand
      </button>
    </form>
  </section>
)}
 <RealtimeMessageThread
  orderId={selectedConversation.order_id}
  latestMessageId={
    orderMessages[orderMessages.length - 1]?.id ?? null
  }
>
                  {orderMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <p className="font-serif text-2xl font-semibold">
                        Start a conversation
                      </p>

                      <p className="mt-2 text-sm text-[#173d32]/50">
                        Send a message about this order.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderMessages.map((orderMessage) => {
                        const isOwnMessage =
                          orderMessage.sender_id === user.id;
                        return (
                          <div
                            key={orderMessage.id}
                            className={`flex ${
                              isOwnMessage
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div className="max-w-[80%]">
                              <p
                                className={`mb-1 text-xs font-semibold ${
                                  isOwnMessage
                                    ? "text-right text-[#173d32]/40"
                                    : "text-[#b76449]"
                                }`}
                              >
                                {isOwnMessage
                                  ? "You"
                                  : selectedConversation.other_user_name}
                              </p>

                              <div
                                className={
                                  isOwnMessage
                                    ? "rounded-2xl rounded-br-sm bg-[#173d32] px-5 py-3.5 text-white"
                                    : "rounded-2xl rounded-bl-sm border border-[#173d32]/10 bg-white px-5 py-3.5"
                                }
                              >
                                <p className="whitespace-pre-wrap leading-7">
                                  {orderMessage.message}
                                </p>

                                <time
                                  dateTime={
                                    orderMessage.created_at
                                  }
                                  className={
                                    isOwnMessage
                                      ? "mt-2 block text-right text-[11px] text-white/45"
                                      : "mt-2 block text-[11px] text-[#173d32]/40"
                                  }
                                >
                                  {new Date(
                                    orderMessage.created_at,
                                  ).toLocaleString("en-PH", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </time>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
            </RealtimeMessageThread>

                {params.error && (
                  <div className="border-t border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
                    {params.error}
                  </div>
                )}
{!(
  moderationStatus?.chat_locked === true &&
  moderationStatus?.chat_lock_reason === "second_warning"
) && (
  <MessageComposer
    orderId={selectedConversation.order_id}
    sendMessageAction={sendMessage}
  />
)}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}