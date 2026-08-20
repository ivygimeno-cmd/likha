import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SupportRequest = {
  id: string;
  category: string;
  feedback_type: string | null;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

const categories = [
  {
    value: "account",
    title: "Account",
    description: "Login, profile, email, o access sa account",
  },
  {
    value: "orders",
    title: "Mga Order",
    description: "Mga tanong o problema tungkol sa isang order",
  },
  {
    value: "payments",
    title: "Pagbabayad",
    description:
      "Mga tanong o problema tungkol sa pagbabayad o transaksyon",
  },
  {
    value: "safety",
    title: "Seguridad",
    description:
      "Kahina-hinalang activity o concern sa seguridad",
  },
  {
    value: "problem",
    title: "Mag-report ng problema",
    description: "May bahagi ng LIKHA na hindi gumagana",
  },
  {
    value: "feedback",
    title: "Feedback",
    description:
      "Mga ideya, suhestiyon, o pangkalahatang feedback",
  },
];

const accountFaqs = [
  {
    question: "Paano ko papalitan ang aking email address?",
    answer:
      "Pumunta sa Mga Setting → Email address. Ilagay ang bago mong email at sundin ang confirmation na ipapadala ng LIKHA sa bagong email address.",
  },
  {
    question:
      "Hindi ko natanggap ang email confirmation. Ano ang gagawin ko?",
    answer:
      "I-check ang Spam o Junk folder at siguraduhing tama ang email address. Kung wala pa rin, mag-request ulit ng confirmation email.",
  },
  {
    question: "Paano ko papalitan ang aking password?",
    answer:
      "Pumunta sa Mga Setting → Password at seguridad → Palitan ang password.",
  },
  {
    question:
      "Nakalimutan ko ang password ko. Ano ang gagawin ko?",
    answer:
      "Sa login page, piliin ang Nakalimutan ang password? at gamitin ang email address ng iyong LIKHA account para makatanggap ng password reset link.",
  },
  {
    question:
      "Paano ko babaguhin ang contact number o address ko?",
    answer:
      "Pumunta sa Mga Setting → Personal na impormasyon upang i-update ang iyong address o contact number.",
  },
  {
    question:
      "Paano ko babaguhin ang verified na pangalan ko?",
    answer:
      "Pumunta sa Mga Setting → Verified na pangalan at mag-request ng pagbabago. Maaaring kailanganin muna itong i-review bago ma-update.",
  },
  {
    question: "May device o login na hindi ko kilala.",
    answer:
      "Pumunta agad sa Mga Setting → Pamahalaan ang sessions. Suriin ang mga naka-sign in na device, gamitin ang Sign out all devices kung kinakailangan, at palitan agad ang iyong password.",
  },
  {
    question: "Bakit ako biglang na-sign out?",
    answer:
      "Maaaring na-expire o na-revoke ang iyong session, nagkaroon ng security-related na pagbabago sa account, o na-sign out ang lahat ng devices.",
  },
  {
    question:
      "Hindi ako makapag-login sa aking account.",
    answer:
      "Siguraduhing tama ang iyong email at password. Kung nakalimutan mo ang password, gamitin ang password reset. Kung hindi pa rin gumana, makipag-ugnayan sa LIKHA Support.",
  },
  {
    question:
      "Paano ko ide-delete o ide-deactivate ang aking account?",
    answer:
      "Makipag-ugnayan sa LIKHA Support para ma-review at maproseso nang maayos ang iyong request.",
  },
];

const orderFaqs = [
  {
    question:
      "Paano ko malalaman ang status ng aking order?",
    answer:
      "Pumunta sa Orders upang makita ang kasalukuyang status ng iyong order, kasama ang mga update mula sa seller o creator.",
  },
  {
    question:
      "Hindi pa ina-accept ng seller ang order ko. Ano ang gagawin ko?",
    answer:
      "Hintayin muna ang response ng seller. Kung matagal nang walang update, maaari kang mag-message sa seller o makipag-ugnayan sa LIKHA Support.",
  },
  {
    question:
      "Pwede ko bang baguhin ang detalye ng order ko?",
    answer:
      "Depende ito sa kasalukuyang status ng order. Kung hindi pa nagsisimula ang paggawa, kausapin agad ang seller sa Messages upang malaman kung maaari pang baguhin ang request.",
  },
  {
    question:
      "Pwede ko bang i-cancel ang aking order?",
    answer:
      "Ang cancellation ay depende sa status ng order at kung nagsimula na ang seller sa paggawa. I-check ang order details at kausapin muna ang seller bago mag-request ng cancellation.",
  },
  {
    question:
      "Walang update ang seller sa order ko.",
    answer:
      "Magpadala muna ng message sa seller. Kung hindi pa rin sumagot o matagal nang walang progress, maaari kang mag-submit ng support request para ma-review ng LIKHA.",
  },
  {
    question:
      "Hindi tugma ang natanggap ko sa napag-usapan.",
    answer:
      "I-save ang anumang larawan, messages, at order details na makakatulong bilang reference. Makipag-ugnayan muna sa seller at kung hindi ma-resolve, mag-report sa LIKHA Support.",
  },
  {
    question:
      "May problema sa delivery ng order ko.",
    answer:
      "I-check muna ang delivery or tracking information kung available. Kung seller-arranged ang delivery, kausapin ang seller para sa update. Kung may dispute, maaaring i-escalate sa LIKHA Support.",
  },
  {
    question:
      "Paano ko makikita ang mga lumang order ko?",
    answer:
      "Pumunta sa Orders page upang makita ang iyong current at previous orders.",
  },
  {
    question:
      "Mali ang order na lumalabas sa account ko.",
    answer:
      "I-refresh muna ang Orders page at siguraduhing tama ang account na naka-login. Kung mali pa rin ang impormasyon, mag-submit ng support request para ma-investigate ng LIKHA.",
  },
];

const paymentFaqs = [
  {
    question:
      "Anong payment methods ang puwedeng gamitin sa LIKHA?",
    answer:
      "Makikita ang available payment methods bago i-confirm ang iyong order. Maaaring mag-iba ang options depende sa seller at sa kasalukuyang payment setup ng LIKHA.",
  },
  {
    question:
      "Na-charge ako pero hindi nag-update ang order.",
    answer:
      "Huwag muna ulitin ang payment. I-check ang payment confirmation at order status. Kung hindi pa rin nag-update pagkatapos ng ilang minuto, makipag-ugnayan sa LIKHA Support at isama ang transaction reference kung available.",
  },
  {
    question: "Bakit failed ang payment ko?",
    answer:
      "Maaaring dahil sa insufficient balance, payment provider issue, network interruption, o invalid payment details. Subukan muli pagkatapos i-check ang iyong payment method.",
  },
  {
    question: "Dalawang beses akong na-charge.",
    answer:
      "I-save ang parehong transaction reference o proof of payment at huwag gumawa ng panibagong payment. Mag-submit agad ng support request para ma-review ng LIKHA ang duplicate charge.",
  },
  {
    question:
      "Saan ko makikita ang payment status ng order ko?",
    answer:
      "Pumunta sa Orders at buksan ang order details. Doon dapat makita ang kasalukuyang payment at order status kapag available.",
  },
  {
    question:
      "Pwede ko bang palitan ang payment method pagkatapos mag-order?",
    answer:
      "Depende ito sa status ng order at payment. Kung hindi pa completed ang payment, maaaring may option na pumili ng ibang payment method. Kung completed na, makipag-ugnayan muna sa LIKHA Support bago gumawa ng panibagong payment.",
  },
  {
    question:
      "Paano kung mali ang amount na na-charge?",
    answer:
      "I-check ang order breakdown at payment receipt. Kung hindi tugma ang amount, mag-submit ng support request kasama ang transaction details para ma-investigate ng LIKHA.",
  },
  {
    question:
      "Gaano katagal bago mag-reflect ang refund?",
    answer:
      "Depende ang processing time sa payment provider at sa paraan ng pagbabayad. Kapag may approved refund, maaaring kailanganin ng ilang business days bago ito lumabas sa iyong account.",
  },
  {
    question:
      "Safe ba ang payment information ko?",
    answer:
      "Hindi dapat ibinibigay sa seller o sa ibang user ang iyong password, OTP, card PIN, o iba pang sensitibong payment credentials. Kung may humihingi nito, i-report agad sa LIKHA.",
  },
];

const safetyFaqs = [
  {
    question:
      "May device o login na hindi ko kilala. Ano ang gagawin ko?",
    answer:
      "Pumunta agad sa Mga Setting → Pamahalaan ang sessions. Suriin ang mga naka-sign in na device, gamitin ang Sign out all devices, at palitan agad ang iyong password.",
  },
  {
    question:
      "May kahina-hinalang activity sa account ko.",
    answer:
      "Palitan agad ang iyong password at i-sign out ang lahat ng devices. Kung may hindi awtorisadong pagbabago sa account, mag-submit ng support request para ma-investigate ng LIKHA.",
  },
  {
    question:
      "May nag-message sa akin na humihingi ng password, OTP, o PIN.",
    answer:
      "Huwag ibigay ang iyong password, OTP, PIN, recovery link, o payment credentials sa kahit sino. Ang LIKHA Support ay hindi dapat humingi ng mga sensitibong security credentials na ito.",
  },
  {
    question:
      "May nagpapanggap na LIKHA Admin o Support.",
    answer:
      "Huwag magbigay ng account o payment information. I-save ang screenshots at iba pang detalye ng usapan at i-report agad sa LIKHA Support para ma-review.",
  },
  {
    question:
      "Na-click ko ang isang kahina-hinalang link.",
    answer:
      "Kung may inilagay kang password o sensitive information pagkatapos i-click ang link, palitan agad ang iyong password at i-sign out ang lahat ng devices. Mag-report din sa LIKHA Support kung may posibleng compromise sa account.",
  },
  {
    question:
      "Paano ko malalaman kung safe pa ang account ko?",
    answer:
      "Suriin ang iyong active sessions, email address, verified information, at recent account activity. Kung may hindi mo kilalang pagbabago o device, i-secure agad ang account.",
  },
  {
    question:
      "Bigla akong na-sign out sa lahat ng devices.",
    answer:
      "Maaaring na-revoke ang iyong sessions bilang security measure, nagbago ang password, o may admin security action sa account. Mag-sign in muli kung pinapayagan pa ang iyong account.",
  },
  {
    question:
      "Paano ko ire-report ang posibleng hacked account?",
    answer:
      "Piliin ang Makipag-ugnayan sa LIKHA Support sa ibaba at ilagay ang lahat ng detalye na alam mo, kabilang ang hindi kilalang device, oras ng activity, at anumang pagbabago sa account.",
  },
];

const problemFaqs = [
  {
    question: "May button o page na hindi gumagana.",
    answer:
      "I-refresh muna ang page at subukang ulitin ang action. Kung hindi pa rin gumana, subukang mag-sign out at mag-sign in muli. Kung persistent ang issue, mag-report sa LIKHA Support.",
  },
  {
    question:
      "Hindi naglo-load nang maayos ang isang page.",
    answer:
      "I-check muna ang internet connection at i-refresh ang page. Kung gumagamit ng browser extension o ad blocker, maaaring makatulong ang pag-disable nito pansamantala habang nagte-test.",
  },
  {
    question: "May error message na lumalabas.",
    answer:
      "Kunin ang exact error message o screenshot kung posible. Makakatulong ito sa LIKHA Support para mas mabilis ma-identify ang problema.",
  },
  {
    question:
      "Hindi nase-save ang ginawa kong pagbabago.",
    answer:
      "Siguraduhing kumpleto ang required fields at stable ang internet connection. Kung enabled ang Save button pero hindi pa rin gumagana, mag-report sa LIKHA Support.",
  },
  {
    question:
      "Mali o luma ang data na nakikita ko.",
    answer:
      "I-refresh muna ang page. Kung hindi pa rin updated ang impormasyon, mag-sign out at mag-sign in muli. Kung mali pa rin, mag-submit ng report kasama ang details kung anong data ang hindi tama.",
  },
  {
    question:
      "Hindi ko makita ang notification o update.",
    answer:
      "I-check ang Notifications at i-refresh ang page. Kung dapat may notification pero wala, ilagay sa report kung anong action ang ginawa mo at kung kailan ito nangyari.",
  },
  {
    question:
      "Biglang nag-close o nag-error ang page habang ginagamit ko.",
    answer:
      "Subukang ulitin ang action at tandaan kung anong page at step ang ginawa bago nag-error. Kung maulit, mag-report sa LIKHA Support at ilagay ang sequence ng ginawa mo.",
  },
  {
    question: "Paano ako magre-report ng bug?",
    answer:
      "Ilagay kung anong page ang may problema, ano ang inaasahan mong mangyari, ano ang aktwal na nangyari, at kung posible ay maghanda ng screenshot o exact error message.",
  },
];

const feedbackTypes = [
  {
    value: "suggestion",
    title: "Suhestiyon",
    description:
      "May ideya ka kung paano pa mapapaganda ang LIKHA.",
  },
  {
    value: "compliment",
    title: "Papuri",
    description:
      "May gusto kang magandang experience o feature na i-share.",
  },
  {
    value: "feature_request",
    title: "Feature request",
    description:
      "May feature kang gustong idagdag o pagandahin sa LIKHA.",
  },
  {
    value: "general",
    title: "Pangkalahatang feedback",
    description:
      "Iba pang komento o opinyon tungkol sa LIKHA.",
  },
];

function categoryLabel(category: string) {
  return (
    categories.find(
      (item) => item.value === category,
    )?.title ?? category
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "in_review":
      return "In Review";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return "Open";
  }
}

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    contact?: string;
    feedback_type?: string;
    success?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const selectedCategory = categories.some(
    (item) => item.value === params.category,
  )
    ? params.category
    : null;

  const {
    data: supportData,
    error: supportError,
  } = await supabase
    .from("support_requests")
    .select(
      `
        id,
        category,
        feedback_type,
        subject,
        message,
        status,
        admin_response,
        created_at,
        updated_at
      `,
    )
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (supportError) {
    throw new Error(
      `Hindi ma-load ang support requests: ${supportError.message}`,
    );
  }

  const supportRequests =
    (supportData ?? []) as SupportRequest[];

  async function submitSupportRequest(
    formData: FormData,
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const category = String(
      formData.get("category") ?? "",
    )
      .trim()
      .toLowerCase();

    const feedbackType = String(
      formData.get("feedbackType") ?? "",
    )
      .trim()
      .toLowerCase();

    const subject = String(
      formData.get("subject") ?? "",
    ).trim();

    const message = String(
      formData.get("message") ?? "",
    ).trim();

    const validCategory = categories.some(
      (item) => item.value === category,
    );

    if (
      !validCategory ||
      subject.length < 3 ||
      message.length < 10
    ) {
      redirect(
        `/help?category=${encodeURIComponent(
          category,
        )}&contact=1&error=invalid`,
      );
    }

    const validFeedbackType =
      category !== "feedback" ||
      feedbackTypes.some(
        (item) => item.value === feedbackType,
      );

    if (!validFeedbackType) {
      redirect(
        "/help?category=feedback&error=invalid_feedback_type",
      );
    }

    const { error } = await supabase
      .from("support_requests")
      .insert({
        user_id: user.id,
        category,
        feedback_type:
          category === "feedback"
            ? feedbackType
            : null,
        subject,
        message,
      });

    if (error) {
      throw new Error(
        `Hindi ma-submit ang request: ${error.message}`,
      );
    }

    redirect("/help?success=1");
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
          <Link
            href="/dashboard"
            className="font-serif text-2xl tracking-[0.22em]"
          >
            LIKHA
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-medium transition hover:text-[#b76449]"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-14 sm:px-10 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b76449]">
            SUPORTA
          </p>

          <h1 className="mt-4 font-serif text-5xl font-normal sm:text-6xl">
            Tulong at Feedback
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#173d32]/55">
            May kailangan ka bang tulong sa iyong LIKHA account o
            may gusto kang ipabuti sa platform? Magpadala sa amin
            ng mensahe at sisiguraduhin naming makarating ito sa
            tamang team.
          </p>
        </div>

        {params.success === "1" && (
          <div className="mt-8 rounded-2xl border border-emerald-700/15 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-800">
              Naipadala na ang iyong request sa LIKHA Support.
            </p>

            <p className="mt-1 text-xs text-emerald-800/60">
              Maaari mong subaybayan ang status nito sa ibaba.
            </p>
          </div>
        )}

        {params.error && (
          <div className="mt-8 rounded-2xl border border-red-700/15 bg-red-50 px-5 py-4">
            <p className="text-sm font-semibold text-red-700">
              Hindi namin maipadala ang iyong request.
            </p>

            <p className="mt-1 text-xs text-red-700/60">
              Pakisuri ang form at subukan muli.
            </p>
          </div>
        )}

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            {!selectedCategory ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
                  MAKIPAG-UGNAYAN SA LIKHA
                </p>

                <h2 className="mt-3 font-serif text-3xl font-normal">
                  Ano ang maitutulong namin?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
                  Piliin ang opsyon na pinakamalapit sa iyong
                  concern.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {categories.map((category) => (
                    <Link
                      key={category.value}
                      href={`/help?category=${category.value}`}
                      className="rounded-2xl border border-[#173d32]/10 p-5 text-left transition hover:border-[#b76449]/40 hover:bg-[#b76449]/5"
                    >
                      <p className="font-semibold">
                        {category.title}
                      </p>

                      <p className="mt-2 text-sm leading-5 text-[#173d32]/50">
                        {category.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            ) : selectedCategory === "account" &&
              params.contact !== "1" ? (
              <FaqSection
                title="ACCOUNT"
                heading="Ano ang kailangan mong tulong?"
                description="Tingnan muna ang mga karaniwang tanong tungkol sa iyong LIKHA account."
                faqs={accountFaqs}
                contactHref="/help?category=account&contact=1"
                contactText="Makipag-ugnayan sa LIKHA Support"
              />
            ) : selectedCategory === "orders" &&
              params.contact !== "1" ? (
              <FaqSection
                title="MGA ORDER"
                heading="Ano ang concern mo sa order?"
                description="Tingnan muna ang mga karaniwang tanong tungkol sa orders."
                faqs={orderFaqs}
                contactHref="/help?category=orders&contact=1"
                contactText="Makipag-ugnayan sa LIKHA Support"
              />
            ) : selectedCategory === "payments" &&
              params.contact !== "1" ? (
              <FaqSection
                title="PAGBABAYAD"
                heading="Ano ang concern mo sa pagbabayad?"
                description="Tingnan muna ang mga karaniwang tanong tungkol sa payment at transactions."
                faqs={paymentFaqs}
                contactHref="/help?category=payments&contact=1"
                contactText="Makipag-ugnayan sa LIKHA Support"
              />
            ) : selectedCategory === "safety" &&
              params.contact !== "1" ? (
              <FaqSection
                title="SEGURIDAD"
                heading="May concern ka ba sa seguridad ng account?"
                description="Tingnan muna ang mga karaniwang tanong tungkol sa account security at kahina-hinalang activity."
                faqs={safetyFaqs}
                contactHref="/help?category=safety&contact=1"
                contactText="Makipag-ugnayan sa LIKHA Support"
              />
            ) : selectedCategory === "problem" &&
              params.contact !== "1" ? (
              <FaqSection
                title="MAG-REPORT NG PROBLEMA"
                heading="May hindi ba gumagana sa LIKHA?"
                description="Subukan muna ang mga karaniwang troubleshooting steps bago mag-submit ng report."
                faqs={problemFaqs}
                contactHref="/help?category=problem&contact=1"
                contactText="I-report sa LIKHA Support"
              />
            ) : selectedCategory === "feedback" &&
              params.contact !== "1" ? (
              <>
                <Link
                  href="/help"
                  className="text-xs font-semibold text-[#b76449] transition hover:opacity-70"
                >
                  ← Bumalik sa lahat ng paksa
                </Link>

                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
                  FEEDBACK
                </p>

                <h2 className="mt-3 font-serif text-3xl font-normal">
                  Ano ang gusto mong ibahagi?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
                  Piliin ang uri ng feedback para mas madaling
                  makarating sa tamang team.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {feedbackTypes.map((feedback) => (
                    <Link
                      key={feedback.value}
                      href={`/help?category=feedback&feedback_type=${feedback.value}&contact=1`}
                      className="rounded-2xl border border-[#173d32]/10 p-5 text-left transition hover:border-[#b76449]/40 hover:bg-[#b76449]/5"
                    >
                      <p className="font-semibold">
                        {feedback.title}
                      </p>

                      <p className="mt-2 text-sm leading-5 text-[#173d32]/50">
                        {feedback.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/help"
                  className="text-xs font-semibold text-[#b76449] transition hover:opacity-70"
                >
                  ← Bumalik sa lahat ng paksa
                </Link>

                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
                  {selectedCategory === "feedback"
                    ? "FEEDBACK"
                    : categoryLabel(selectedCategory)}
                </p>

                <h2 className="mt-3 font-serif text-3xl font-normal">
                  {selectedCategory === "feedback"
                    ? "Ibahagi ang iyong feedback."
                    : "Ikuwento sa amin ang nangyari."}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
                  {selectedCategory === "feedback"
                    ? "Ibahagi ang iyong suhestiyon, komento, o karanasan para makatulong sa pagpapaganda ng LIKHA."
                    : "Magbigay ng sapat na detalye para maintindihan at ma-review ng LIKHA Support ang iyong concern."}
                </p>

                <form
                  action={submitSupportRequest}
                  className="mt-8 space-y-6"
                >
                  <input
                    type="hidden"
                    name="category"
                    value={selectedCategory}
                  />

                  {selectedCategory === "feedback" && (
                    <input
                      type="hidden"
                      name="feedbackType"
                      value={params.feedback_type ?? ""}
                    />
                  )}

                  {selectedCategory === "feedback" &&
                    params.feedback_type && (
                      <div className="rounded-xl border border-[#173d32]/10 bg-[#173d32]/5 px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#173d32]/45">
                          Uri ng feedback
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {feedbackTypes.find(
                            (item) =>
                              item.value ===
                              params.feedback_type,
                          )?.title ?? "Feedback"}
                        </p>
                      </div>
                    )}

                  <div>
                    <label
                      htmlFor="subject"
                      className="text-sm font-semibold"
                    >
                      Paksa
                    </label>

                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      minLength={3}
                      maxLength={150}
                      placeholder="Maikling ilarawan ang iyong concern"
                      className="mt-2 w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#173d32]/30 focus:border-[#b76449]/60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="text-sm font-semibold"
                    >
                      Detalye
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={8}
                      placeholder="Ilagay ang buong detalye at anumang impormasyong makakatulong sa pag-review."
                      className="mt-2 w-full resize-y rounded-xl border border-[#173d32]/15 bg-white px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#173d32]/30 focus:border-[#b76449]/60"
                    />

                  </div>

                  <button
                    type="submit"
                    className="inline-flex rounded-xl bg-[#173d32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#b76449]"
                  >
                    Ipadala sa LIKHA Support
                  </button>
                </form>
              </>
            )}
          </section>

          <aside className="rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
              IYONG MGA REQUEST
            </p>

            <h2 className="mt-3 font-serif text-3xl font-normal">
              History ng Support
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
              Status ng iyong mga request at mga sagot mula sa
              LIKHA Support.
            </p>

            {supportRequests.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-[#173d32]/15 px-5 py-8 text-center">
                <p className="text-sm font-medium">
                  Wala ka pang support request.
                </p>

                <p className="mt-2 text-xs leading-5 text-[#173d32]/45">
                  Dito lalabas ang iyong mga request at sagot mula
                  sa LIKHA Support.
                </p>
              </div>
            ) : (
              <div className="mt-8 divide-y divide-[#173d32]/10 border-y border-[#173d32]/10">
                {supportRequests.map((request) => (
                  <div
                    key={request.id}
                    className="py-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b76449]">
                          {categoryLabel(
                            request.category,
                          )}
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold">
                          {request.subject}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#173d32]/5 px-2.5 py-1 text-[10px] font-semibold">
                        {statusLabel(request.status)}
                      </span>
                    </div>

                    {request.category === "feedback" &&
                      request.feedback_type && (
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#173d32]/40">
                          {feedbackTypes.find(
                            (item) =>
                              item.value ===
                              request.feedback_type,
                          )?.title ??
                            request.feedback_type}
                        </p>
                      )}

                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-[#173d32]/50">
                      {request.message}
                    </p>

                    {request.admin_response && (
                      <div className="mt-4 rounded-xl bg-[#173d32]/5 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#173d32]/45">
                          LIKHA Support
                        </p>

                        <p className="mt-2 text-xs leading-5">
                          {request.admin_response}
                        </p>
                      </div>
                    )}

                    <p className="mt-3 text-[10px] text-[#173d32]/35">
                      {new Date(
                        request.created_at,
                      ).toLocaleString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function FaqSection({
  title,
  heading,
  description,
  faqs,
  contactHref,
  contactText,
}: {
  title: string;
  heading: string;
  description: string;
  faqs: {
    question: string;
    answer: string;
  }[];
  contactHref: string;
  contactText: string;
}) {
  return (
    <>
      <Link
        href="/help"
        className="text-xs font-semibold text-[#b76449] transition hover:opacity-70"
      >
        ← Bumalik sa lahat ng paksa
      </Link>

      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-[#b76449]">
        {title}
      </p>

      <h2 className="mt-3 font-serif text-3xl font-normal">
        {heading}
      </h2>

      <p className="mt-3 text-sm leading-6 text-[#173d32]/55">
        {description}
      </p>

      <div className="mt-8 divide-y divide-[#173d32]/10 border-y border-[#173d32]/10">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group py-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-medium">
              <span>{faq.question}</span>

              <span className="shrink-0 text-lg font-normal text-[#b76449] transition-transform group-open:rotate-45">
                +
              </span>
            </summary>

            <p className="mt-4 max-w-2xl pr-8 text-sm leading-6 text-[#173d32]/55">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-[#173d32]/5 p-5">
        <p className="font-semibold">
          Hindi nasagot ang concern mo?
        </p>

        <p className="mt-2 text-sm leading-6 text-[#173d32]/55">
          Magpadala ng mensahe sa LIKHA Support para matulungan
          ka namin.
        </p>

        <Link
          href={contactHref}
          className="mt-4 inline-flex rounded-xl bg-[#173d32] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b76449]"
        >
          {contactText}
        </Link>
      </div>
    </>
  );
}