import Image from "next/image";
import type { StrapiSmallBanner } from "@/services/strapi";

type SmallBannerProps = Omit<StrapiSmallBanner, "__component">;

export default function SmallBanner({
  title,
  backgroundImage,
}: SmallBannerProps) {
  return (
    <div className="relative flex items-center justify-center h-48 bg-neutral-900 text-white overflow-hidden">
      {backgroundImage && (
        <Image
          src={backgroundImage.url}
          alt={backgroundImage.alternativeText ?? ""}
          fill
          className="object-cover opacity-50"
          unoptimized
        />
      )}
      <div className="relative z-10 text-center px-6">
        {title && (
          <h2 className="text-3xl md:text-4xl font-semibold">{title}</h2>
        )}
      </div>
    </div>
  );
}
