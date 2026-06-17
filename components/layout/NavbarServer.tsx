import { Navbar } from "@/components/layout/Navbar";
import { getNavbar } from "@/services/strapi";

/**
 * Server-side wrapper that fetches navigation data and passes it to the client-rendered Navbar.
 *
 * @returns The navbar, populated with data from Strapi.
 */
export default async function NavbarServer() {
  const links = await getNavbar();
  return <Navbar links={links} />;
}
