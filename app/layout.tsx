import { Source_Sans_3 } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { getNavbar } from "@/services/strapi";

/**
 * Google Font configuration for Source Sans 3.
 */
const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
});

/**
 * Properties passed to the root layout.
 */
export type RootLayoutProps = {
  /**
   * Page content rendered inside the layout.
   */
  readonly children: React.ReactNode;
};

/**
 * The root layout for the application.
 *
 * @param rootLayoutProps Properties passed to the root layout.
 * @returns The root layout component.
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  const navbar = await getNavbar();
  return (
    <html lang="en" className={`${sourceSans3.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sourcesans">
        <Navbar links={navbar} />
        {children}
      </body>
    </html>
  );
}
