import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPage, type StrapiPageSection } from "@/services/strapi";
import RichText from "@/components/modules/RichText";
import SmallBanner from "@/components/modules/SmallBanner";
import HallReservations from "@/components/hall-reservations/HallReservations";

/**
 * Renders a single page section based on its component type
 *
 * @internal
 * @param section The page section to render.
 * @param index The index used as the React key.
 * @param slug The slug of the page the section is on.
 * @returns The rendered section component, or null for unknown component.
 */
function renderSection(
  section: StrapiPageSection,
  index: number,
  slug: string,
) {
  switch (section.__component) {
    case "page.section":
      return <RichText key={index} content={section.content} />;
    case "page.banner":
      return <SmallBanner key={index} {...section} />;
    case "page.hall-reservation":
      return (
        <HallReservations
          key={index}
          halls={section.hall}
          pageSlug={slug}
          sectionId={section.id}
        />
      );
    default:
      return null;
  }
}

/**
 * Generates page metadata from Strapi page data.
 *
 * @param params Route parameters containing the page slug.
 * @returns Page metadata including title and meta description
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription,
  };
}

/**
 * Page router that renders a Strapi page by slug.
 *
 * @param params Route parameters that contain the page slug.
 * @returns The rendered page, or a 404 when no matching page is found.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  return (
    <main>
      {page.pageSections.map((section, index) =>
        renderSection(section, index, page.slug),
      )}
    </main>
  );
}
