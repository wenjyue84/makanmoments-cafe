import { Suspense } from "react";
import { getFeaturedItems } from "@/lib/menu";
import { HeroSection } from "@/components/home/hero-section";
import { Highlights } from "@/components/home/highlights";
import { InfoStrip } from "@/components/home/info-strip";
import { HighlightsSkeleton } from "@/components/home/highlights-skeleton";

export const revalidate = 3600;

async function HighlightsLoader() {
  const featured = await getFeaturedItems();
  return <Highlights items={featured} />;
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <InfoStrip />
      <Suspense fallback={<HighlightsSkeleton />}>
        <HighlightsLoader />
      </Suspense>
    </>
  );
}
