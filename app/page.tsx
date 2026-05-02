import { Metadata } from "next";

import BigBanner from "@/components/modules/BigBanner";

import bannerImage from "@/assets/img/header-home.jpg";

export const metadata: Metadata = {
  title: "Home | ESDV Footloose",
  description:
    "Welcome to Eindhovense Studenten Dans Vereniging Footloose. We are the student dance association of Eindhoven, and we organize various dance activities for students.",
};

/**
 * Homepage for the website.
 * @returns {React.Fragment} The homepage component.
 */
export default function Home() {
  return (
    <>
      {/* Initial view banner */}
      <BigBanner
        img={bannerImage}
        imgAlt="Footloose grouphug"
        boardSlogan="Dance the night away!"
      />
    </>
  );
}
