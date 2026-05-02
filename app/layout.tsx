import { Source_Sans_3 } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
});

/**
 * The root layout for the application.
 * @param {object} props The properties passed to this component.
 * @param {React.Fragment} props.children The page content rendered inside the layout.
 * @returns {React.Fragment} The RootLayout component.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans3.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sourcesans">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
