import Image from "next/image";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import Link from "next/link";

/**
 * Properties passed to the big banner component.
 */
export type BigBannerProps = {
  /**
   * Background image displayed in the banner.
   */
  readonly img: Parameters<typeof Image>[0]["src"];

  /**
   * Alt text for the background image.
   */
  readonly imgAlt: string;

  /**
   * Current board slogan shown on top of the banner.
   */
  readonly boardSlogan: string;
};

/**
 * Big banner with commercial text, a call to action and a button.
 *
 * @param bigBannerProps Properties passed to the big banner component.
 * @returns The big banner component.
 */
export default function BigBanner({
  img,
  imgAlt,
  boardSlogan,
}: BigBannerProps) {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center">
      {/* Footloose image */}
      <Image
        className="object-cover object-top relative z-0"
        src={img}
        alt={imgAlt}
        sizes="100vw"
        fill
        priority
        unoptimized
      />

      {/* Grey image overlay */}
      <div className="absolute inset-0 w-full h-full bg-black opacity-50 z-10" />

      {/* Text and button */}
      <div className="z-20 absolute top-[80%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
        <p className="text-2xl md:text-3xl lg:text-4xl">{boardSlogan}</p>
        <div className="grid place-content-center py-4 my-2">
          <Link
            href="/register"
            passHref
            className="group flex text-sm sm:text-md md:text-lg h-10 items-center gap-2 rounded-full border-2 border-white bg-transparent pl-3 pr-4 transition-all duration-300 ease-in-out hover:bg-black hover:bg-opacity-50 hover:pl-2 hover:text-white active:bg-neutral-700 min-w-53.75"
          >
            <span className="rounded-full bg-white p-1 text-sm transition-colors duration-300 group-hover:bg-white">
              <FiArrowRight className="translate-x-[-200%] text-[0px] transition-all duration-300 group-hover:translate-x-0 group-hover:text-lg group-hover:text-black group-active:-rotate-45" />
            </span>
            <span>Become a member here!</span>
          </Link>
        </div>
        <div className="flex items-center justify-center ml-2">
          <Link href="#about">
            <FiChevronDown className="text-2xl md:text-3xl lg:text-4xl hover:scale-125 transition-transform mt-8" />
          </Link>
        </div>
      </div>
    </div>
  );
}
