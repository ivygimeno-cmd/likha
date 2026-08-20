import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export default async function VerifiedNameSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: pendingRequest } = await supabase
    .from("account_change_requests")
    .select(
      "id, requested_value, reason, id_document_path, status, created_at",
    )
    .eq("user_id", user.id)
    .eq("request_type", "name")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  async function submitNameChangeRequest(
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

    const requestedName = String(
      formData.get("requestedName") ?? "",
    ).trim();

    const reason = String(
      formData.get("reason") ?? "",
    ).trim();

    const idDocument = formData.get("idDocument");

    if (requestedName.length < 2) {
      throw new Error("Invalid requested name.");
    }

    if (reason.length < 3) {
      throw new Error(
        "Please provide a reason for changing your name.",
      );
    }

    if (
      !(idDocument instanceof File) ||
      idDocument.size === 0
    ) {
      throw new Error(
        "Please upload a valid ID for verification.",
      );
    }

    if (!allowedTypes.includes(idDocument.type)) {
      throw new Error(
        "JPG, PNG, WebP, or PDF files only.",
      );
    }

    if (idDocument.size > MAX_FILE_SIZE) {
      throw new Error(
        "Maximum ID document size is 5 MB.",
      );
    }

    const { data: existingPending } = await supabase
      .from("account_change_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("request_type", "name")
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existingPending) {
      throw new Error(
        "You already have a pending name change request.",
      );
    }

    const extension =
      idDocument.name.split(".").pop()?.toLowerCase() ??
      "file";

    const filePath =
      `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("identity-change-documents")
        .upload(filePath, idDocument, {
          upsert: false,
          contentType: idDocument.type,
        });

    if (uploadError) {
      throw new Error(
        `Hindi ma-upload ang ID: ${uploadError.message}`,
      );
    }

    const { error: requestError } = await supabase
      .from("account_change_requests")
      .insert({
        user_id: user.id,
        request_type: "name",
        current_value: profile?.full_name ?? null,
        requested_value: requestedName,
        reason,
        id_document_path: filePath,
        status: "pending",
      });

    if (requestError) {
      await supabase.storage
        .from("identity-change-documents")
        .remove([filePath]);

      throw new Error(
        `Hindi ma-submit ang name change request: ${requestError.message}`,
      );
    }

    redirect("/settings/verified-name?submitted=1");
  }

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      <header className="border-b border-[#173d32]/10 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/settings"
            className="font-serif text-3xl tracking-[0.22em]"
          >
            LIKHA
          </Link>

          <Link
            href="/settings"
            className="text-sm font-medium transition hover:text-[#b76449]"
          >
            ← Settings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-14 sm:px-10 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b76449]">
          Account
        </p>

        <h1 className="mt-4 font-serif text-5xl font-normal">
          Verified name
        </h1>

        <p className="mt-5 max-w-2xl leading-7 text-[#173d32]/55">
          Ang pagbabago ng verified name ay kailangang
          repasuhin ng LIKHA Admin. Kailangan ding magsumite
          ng valid ID na nagpapakita ng requested name.
        </p>

        <section className="mt-10 rounded-[22px] border border-[#173d32]/15 bg-[#fbf8f1] p-7 sm:p-9">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#173d32]/45">
              Current verified name
            </p>

            <p className="mt-2 text-lg">
              {profile?.full_name ?? "Not provided"}
            </p>
          </div>

          {pendingRequest ? (
            <div className="mt-8 rounded-2xl border border-[#b76449]/20 bg-[#b76449]/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b76449]">
                Pending review
              </p>

              <p className="mt-3 text-sm text-[#173d32]/55">
                Requested name
              </p>

              <p className="mt-1 font-medium">
                {pendingRequest.requested_value}
              </p>

              <p className="mt-4 text-sm text-[#173d32]/55">
                Reason
              </p>

              <p className="mt-1 leading-6">
                {pendingRequest.reason}
              </p>

              <p className="mt-4 text-sm text-[#173d32]/55">
                Verification document
              </p>

              <p className="mt-1 text-sm font-medium">
                ID submitted securely
              </p>

              <p className="mt-4 text-xs text-[#173d32]/40">
                Submitted{" "}
                {new Date(
                  pendingRequest.created_at,
                ).toLocaleString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ) : (
            <form
              action={submitNameChangeRequest}
              className="mt-8 space-y-6"
            >
              <div>
                <label
                  htmlFor="requestedName"
                  className="mb-2 block text-sm font-medium"
                >
                  Requested new name
                </label>

                <input
                  id="requestedName"
                  name="requestedName"
                  type="text"
                  required
                  minLength={2}
                  placeholder="Full legal name"
                  className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 outline-none transition focus:border-[#b76449]"
                />
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-medium"
                >
                  Reason for changing
                </label>

                <textarea
                  id="reason"
                  name="reason"
                  rows={4}
                  required
                  minLength={3}
                  placeholder="Halimbawa: Updated legal name after marriage."
                  className="w-full resize-y rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 leading-7 outline-none transition focus:border-[#b76449]"
                />
              </div>

              <div>
                <label
                  htmlFor="idDocument"
                  className="mb-2 block text-sm font-medium"
                >
                  Valid ID
                </label>

                <input
                  id="idDocument"
                  name="idDocument"
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="w-full rounded-xl border border-[#173d32]/15 bg-white px-4 py-3.5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-[#173d32] file:px-4 file:py-2 file:font-medium file:text-white"
                />

                <p className="mt-2 text-xs leading-5 text-[#173d32]/45">
                  JPG, PNG, WebP, or PDF. Maximum 5 MB.
                  Your document is stored privately and is used
                  only for account verification.
                </p>
              </div>

              <div className="border-t border-[#173d32]/10 pt-6">
                <button
                  type="submit"
                  className="rounded-xl bg-[#173d32] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#245646]"
                >
                  Submit verification request
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}