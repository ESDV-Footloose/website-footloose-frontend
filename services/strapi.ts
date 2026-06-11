import "server-only";
import type { NavItem } from "@/components/layout/Navbar";
import type { RichTextBlock } from "@/components/modules/RichText";

/**
 * Where to locate the website or development server.
 *
 * @internal
 */
const API_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337";

/**
 * Generic Strapi navigation component structure.
 *
 * @internal
 */
export type StrapiComponent = {
  /**
   * Whether the navigation item is a single link or a dropdown.
   */
  __component: string;
  /**
   * The displayed label.
   */
  text: string;
  /**
   * The URL the navigation item links to.
   */
  url: string;
  /**
   * If the component is a dropdown, the navigation items it contains. Is empty for a single link.
   */
  items?: StrapiComponent[];
};

/**
 * Generic Strapi section structure
 *
 * @internal
 */
export type StrapiSection = {
  /**
   * The section component.
   */
  __component: "page.section";
  /**
   * The rich text content.
   */
  content: RichTextBlock[];
};

/**
 * Strapi small banner structure.
 *
 * @internal
 */
export type StrapiSmallBanner = {
  /**
   * The banner component.
   */
  __component: "page.banner";
  /**
   * The title displayed on the banner.
   */
  title: string;
  /**
   * Optional background image.
   *  */
  backgroundImage?: {
    /**
     * Image URL.
     */
    url: string;
    /**
     * Alt text for the image.
     */
    alternativeText: string | null;
    /**
     * Image width in pixels.
     */
    width: number;
    /**
     * Image height in pixels.
     */
    height: number;
  };
};

/**
 * Union of all possible page section components.
 *
 * @internal
 */
export type StrapiPageSection = StrapiSection | StrapiSmallBanner;

/**
 * Strapi page structure.
 *
 * @internal
 */
export type StrapiPage = {
  /**
   * The page title.
   */
  title: string;
  /**
   * The page slug used in the URL.
   */
  slug: string;
  /**
   * Optional meta description.
   */
  metaDescription?: string;
  /**
   * Ordered list of page sections.
   */
  pageSections: StrapiSection[];
};

/**
 * Generic fetch wrapper for Strapi API requests.
 *
 * @internal
 * @param endpoint API endpoints relative to `/api/`.
 * @param options Optional fetch configuration overrides.
 * @returns Parsed JSON response from Strapi.
 * @throws Error when the request fails.
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}/api/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error?.message || "API error");

  return data;
}

/**
 * Fetches navbar data from Strapi and displays it.
 *
 * @returns Array of navigation items used by the Navbar component
 */
export async function getNavbar(): Promise<NavItem[]> {
  const res = await fetchAPI("navbar?populate[items][populate]=*");
  const items = res?.data?.items || res?.data?.attributes?.items || [];

  return mapNavbar(items ?? []);
}

/**
 * Maps raw Strapi components into typed NavItem structures.
 *
 * @internal
 * @param items Raw Strapi navigation components.
 * @returns Transformed navigation items.
 */
export function mapNavbar(items: StrapiComponent[]): NavItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    if (item.__component === "navbar.link") {
      return {
        text: item.text,
        href: item.url,
      };
    }

    if (item.__component === "navbar.dropdown") {
      return {
        text: item.text,
        href: item.url || "#",
        menu: [
          {
            title: undefined,
            links: (item.items ?? []).map((l: StrapiComponent) => ({
              text: l.text,
              href: l.url,
            })),
          },
        ],
      };
    }

    return {
      text: "",
      href: "#",
    };
  });
}

/**
 * Fetches a page by slug from Strapi and maps its sections into typed structures.
 *
 * @internal
 * @param slug The page slug to fetch.
 * @returns Typed page data, or null when no matching page is found.
 */
export async function getPage(slug: string): Promise<StrapiPage | null> {
  const res = await fetchAPI(
    `pages?filters[slug][$eq]=${slug}&populate[pageSections][populate]=*`,
  );

  const item = res?.data?.[0];
  if (!item) return null;

  const pageSections = (item.pageSections ?? []).map(
    (section: StrapiPageSection) => {
      if (section.__component === "page.section") {
        return {
          ...section,
          content: Array.isArray((section as StrapiSection).content)
            ? (section as StrapiSection).content
            : [],
        };
      }
      if (section.__component === "page.banner") {
        const banner = section as StrapiSmallBanner;
        return {
          ...banner,
          backgroundImage: banner.backgroundImage
            ? {
                ...banner.backgroundImage,
                url: `${API_URL}${banner.backgroundImage.url}`,
              }
            : undefined,
        };
      }
      return section;
    },
  );

  return {
    title: item.title,
    slug: item.slug,
    metaDescription: item.metaDescription,
    pageSections,
  };
}
