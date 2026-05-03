import "server-only";
import type { NavItem } from "@/types/navbar";

const API_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337";

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

export type StrapiComponent = {
  __component: string;
  text: string;
  url: string;
  items?: StrapiComponent[];
};

export async function getNavbar(): Promise<NavItem[]> {
  const res = await fetchAPI("navbar?populate[items][populate]=*");
  const items = res?.data?.items || res?.data?.attributes?.items || [];

  return mapNavbar(items ?? []);
}

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
