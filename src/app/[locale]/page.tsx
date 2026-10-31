import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Categories } from "@/components/home/Categories";
import { Featured } from "@/components/home/Featured";
import { Hero } from "@/components/home/Hero";
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
      <WhyUs />
      <Teasers />
    </>
  );
}
