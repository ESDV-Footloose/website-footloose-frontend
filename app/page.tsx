import { Metadata } from "next";
import BigBanner from "@/components/modules/BigBanner";
import RichText from "@/components/modules/RichText";
import SmallBanner from "@/components/modules/SmallBanner";
import { getHomepage, type StrapiHomepageSection } from "@/services/strapi";
/**
 * Metadata for the homepage.
 */
export const metadata: Metadata = {
  title: "Home | ESDV Footloose",
  description:
    "Welcome to Eindhovense Studenten Dans Vereniging Footloose. We are the student dance association of Eindhoven, and we organize various dance activities for students.",
};

/**
 * Renders a single homepage section based on its component type.
 *
 * @internal
 * @param section The page section to render.
 * @param index Index used as the React key.
 * @returns The rendered section component.
 */
function renderSection(section: StrapiHomepageSection, index: number) {
  switch (section.__component) {
    case "page.section":
      return <RichText key={index} content={section.content} />;
    case "page.banner":
      return <SmallBanner key={index} {...section} />;
    case "page.big-banner":
      return (
        <BigBanner
          key={index}
          img={section.img?.url ?? ""}
          imgAlt={section.img?.alternativeText ?? ""}
          boardSlogan={section.boardSlogan}
        />
      );
    default:
      return null;
  }
}

/**
 * Homepage for the website.
 *
 * @returns The homepage component.
 */
export default async function Home() {
  const homepage = await getHomepage();

  return <main>{homepage?.pageSections.map(renderSection)}</main>;
}
