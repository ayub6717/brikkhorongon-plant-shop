import { Categories } from "@/components/home/Categories";
import { Featured } from "@/components/home/Featured";
import { ForYou } from "@/components/home/ForYou";
import { Hero } from "@/components/home/Hero";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { Teasers } from "@/components/home/Teasers";
import { WhyUs } from "@/components/home/WhyUs";

export default function HomePage() {
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
