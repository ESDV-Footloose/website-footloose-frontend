import "server-only";
import type { NavItem } from "@/components/layout/Navbar";

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
 * @external
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
