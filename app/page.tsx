import { Metadata } from "next";

import BigBanner from "@/components/modules/BigBanner";
import Navbar from "@/components/layout/Navbar";

import bannerImage from "@/assets/img/header-home.jpg";

import { getNavbar } from "@/services/strapi";

export const metadata: Metadata = {
  title: "Home | ESDV Footloose",
  description:
    "Welcome to Eindhovense Studenten Dans Vereniging Footloose. We are the student dance association of Eindhoven, and we organize various dance activities for students.",
};

export default async function Home() {
  const navbar = await getNavbar();

  return (
    <>
      <Navbar links={navbar} />
      <main>
        {/* Initial view banner */}
        <BigBanner
          img={bannerImage}
          imgAlt="Footloose grouphug"
          boardSlogan="Dance the night away!"
        />
      </main>
    </>
  );
}
