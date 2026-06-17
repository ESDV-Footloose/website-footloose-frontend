import { Source_Sans_3 } from "next/font/google";
import "@/styles/globals.css";
import NavbarServer from "@/components/layout/NavbarServer";

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
 * A component can be rebuild once every 5 seconds max.
 * A component is rebuilt when a request is made to it and the cache has expired.
 * When a component is rebuilt, the cached component (if it exists) is first served, then replaced with the rebuild.
 */
export const revalidate = 5;

/**
 * The root layout for the application.
 *
 * @param rootLayoutProps Properties passed to the root layout.
 * @returns The root layout component.
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${sourceSans3.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sourcesans">
        <NavbarServer />
        {children}
      </body>
    </html>
  );
}
