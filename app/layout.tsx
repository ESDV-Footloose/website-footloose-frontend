import { Source_Sans_3 } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";

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
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${sourceSans3.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sourcesans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
