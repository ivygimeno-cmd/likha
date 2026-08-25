import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const query = request.nextUrl.searchParams
      .get("q")
      ?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        people: [],
        projects: [],
      });
    }

    const search = `%${query}%`;

    // Search people across the profile information
    const { data: peopleData, error: peopleError } =
      await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            business_name,
            avatar_url,
            role
          `,
        )
        .or(
          [
            `full_name.ilike.${search}`,
            `business_name.ilike.${search}`,
            `city.ilike.${search}`,
            `address.ilike.${search}`,
            `address_country.ilike.${search}`,
            `address_province.ilike.${search}`,
            `address_city_municipality.ilike.${search}`,
            `address_barangay.ilike.${search}`,
            `address_street.ilike.${search}`,
            `address_postal_code.ilike.${search}`,
          ].join(","),
        )
        .limit(8);

    if (peopleError) {
      console.error(
        "People search error:",
        peopleError,
      );
    }

    // Search portfolio projects
    const { data: projectData, error: projectError } =
      await supabase
        .from("portfolio_projects")
        .select(
          `
            id,
            title,
            description,
            owner_id
          `,
        )
        .or(
          [
            `title.ilike.${search}`,
            `description.ilike.${search}`,
          ].join(","),
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(8);

    if (projectError) {
      console.error(
        "Project search error:",
        projectError,
      );
    }

    const projectOwnerIds = [
      ...new Set(
        (projectData ?? [])
          .map((project) => project.owner_id)
          .filter(Boolean),
      ),
    ];

    let owners: Record<
      string,
      {
        full_name: string | null;
        business_name: string | null;
      }
    > = {};

    if (projectOwnerIds.length > 0) {
      const { data: ownerData } =
        await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              business_name
            `,
          )
          .in("id", projectOwnerIds);

      owners = Object.fromEntries(
        (ownerData ?? []).map((owner) => [
          owner.id,
          {
            full_name: owner.full_name,
            business_name: owner.business_name,
          },
        ]),
      );
    }

    const people = (peopleData ?? []).map(
      (person) => ({
        id: person.id,
        full_name: person.full_name,
        business_name: person.business_name,
        avatar_url: person.avatar_url,
        role: person.role,
      }),
    );

    const projects = (projectData ?? []).map(
      (project) => {
        const owner = owners[project.owner_id];

        return {
          id: String(project.id),
          title: project.title,
          product_type:
            owner?.business_name ?? null,
          location: null,
        };
      },
    );

    return NextResponse.json({
      people,
      projects,
    });
  } catch (error) {
    console.error("Global search error:", error);

    return NextResponse.json(
      {
        people: [],
        projects: [],
        error: "Search failed",
      },
      { status: 500 },
    );
  }
}