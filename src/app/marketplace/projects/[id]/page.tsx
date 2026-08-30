import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthenticatedNavbar from "@/app/components/authenticated-navbar";

type PortfolioProject = {
  id: number;
  title: string;
  description: string | null;
  image_path: string | null;
  owner_id: string;
  created_at: string;
};

type CreatorProfile = {
  id: string;
  display_name: string | null;
  role: string | null;
};

export default async function FeaturedProjectPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project, error: projectError } =
    await supabase
      .from("portfolio_projects")
      .select(
        "id, title, description, image_path, owner_id, created_at",
      )
      .eq("id", projectId)
      .maybeSingle();

  if (projectError || !project) {
    notFound();
  }

  const { data: featured } = await supabase
    .from("featured_projects")
    .select("project_id, is_active")
    .eq("project_id", project.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!featured) {
    notFound();
  }

  const { data: creator } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", project.owner_id)
    .maybeSingle();

  const imageUrl = project.image_path
    ? supabase.storage
        .from("portfolio-images")
        .getPublicUrl(project.image_path).data
        .publicUrl
    : null;

  const creatorName =
    creator?.display_name ?? "LIKHA Creator";

  return (
    <main className="min-h-screen bg-[#f5f0e6] text-[#173d32]">
      {user && <AuthenticatedNavbar />}

      {!user && (
        <header className="border-b border-[#173d32]/15 bg-[#f5f0e6]">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
            <Link
              href="/"
              className="font-serif text-3xl font-semibold tracking-[0.2em]"
            >
              LIKHA
            </Link>

            <Link
              href="/login"
              className="rounded-md bg-[#173d32] px-5 py-3 text-sm font-semibold text-white"
            >
              Mag-sign in
            </Link>
          </nav>
        </header>
      )}

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-16">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#b76449] transition hover:text-[#173d32]"
        >
          ← Bumalik sa Marketplace
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div className="overflow-hidden rounded-3xl border border-[#173d32]/15 bg-[#fbf8f1]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={project.title}
                className="block h-auto max-h-[760px] w-full object-contain"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-[#e9e1d2]">
                <span className="font-serif text-4xl font-semibold text-[#173d32]/30">
                  LIKHA
                </span>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-28">
            <span className="inline-flex rounded-full bg-[#173d32] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f3dfad]">
              Featured creation
            </span>

            <h1 className="mt-5 font-serif text-4xl leading-tight font-semibold sm:text-5xl">
              {project.title}
            </h1>

            <div className="mt-6 border-y border-[#173d32]/15 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#173d32]/45">
                Creator
              </p>

              <Link
                href={`/profile/${project.owner_id}`}
                className="mt-2 inline-block text-lg font-semibold text-[#b76449] hover:text-[#173d32]"
              >
                {creatorName}
              </Link>
            </div>

            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#173d32]/45">
                About this creation
              </p>

              <p className="mt-3 whitespace-pre-line text-base leading-8 text-[#173d32]/70">
                {project.description ||
                  "Walang description na inilagay ang creator para sa project na ito."}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={`/messages?recipient=${encodeURIComponent(
                  project.owner_id,
                )}`}
                className="flex w-full items-center justify-center rounded-xl bg-[#173d32] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#245646]"
              >
                Kontakin ang Creator
              </Link>

              <Link
                href={`/profile/${project.owner_id}`}
                className="flex w-full items-center justify-center rounded-xl border border-[#173d32]/20 bg-[#fbf8f1] px-6 py-4 text-sm font-semibold transition hover:border-[#b76449] hover:text-[#b76449]"
              >
                Tingnan ang Creator Profile
              </Link>
            </div>

            <div className="mt-8 rounded-2xl bg-[#e9e1d2] p-5">
              <p className="text-sm leading-6 text-[#173d32]/65">
                Interesado sa ganitong gawa? Maaari mong
                kontakin ang creator para magtanong tungkol
                sa customization, pricing, at availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}