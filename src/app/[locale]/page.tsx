import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Categories } from "@/components/home/Categories";
import { Featured } from "@/components/home/Featured";
import { ForYou } from "@/components/home/ForYou";
import { Hero } from "@/components/home/Hero";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { Teasers } from "@/components/home/Teasers";
import { WhyUs } from "@/components/home/WhyUs";

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Categories />
      <Featured />
      <ForYou />
      <div className="mx-auto max-w-7xl px-4 sm:px-6"><RecentlyViewed /></div>
      <WhyUs />
      <Teasers />
    </>
  );
}
