import React from 'react';
import { getHomePageData } from '@/lib/anime';
import { HeroSection } from '@/components/HeroSection';
import { AnimeSection } from '@/components/AnimeSection';

export const revalidate = 60; // Cache on server for 60s for instant response

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div className="w-full flex flex-col">
      {/* Hero Section Carousel */}
      <HeroSection items={data.hero} />

      {/* Main Content Area (Pulled up seamlessly into hero gradient) */}
      <div className="w-full space-y-4 -mt-20 md:-mt-28 relative z-20 pb-12">
        {/* Trending This Week */}
        {data.trending.weekly.length > 0 && (
          <AnimeSection
            id="trending"
            title="Trending This Week"
            subtitle="Most watched series and hot releases this week across providers"
            iconName="flame"
            items={data.trending.weekly}
            viewAllHref="/genres"
            badge="Hot"
          />
        )}

        {/* Latest Episodes (AnimeSalt) */}
        {data.latestEpisodes && data.latestEpisodes.length > 0 && (
          <AnimeSection
            id="latest-episodes"
            title="Latest Episodes"
            subtitle="Freshly added dubbed and subbed anime episodes"
            iconName="tv"
            items={data.latestEpisodes}
            viewAllHref="/genres"
            badge="Latest"
          />
        )}

        {/* Popular Series */}
        {data.popular.length > 0 && (
          <AnimeSection
            id="popular"
            title="Popular Anime Series"
            subtitle="All-time fan favorites, top rated hits, and classics"
            iconName="sparkles"
            items={data.popular}
            viewAllHref="/genres"
            badge="Top"
          />
        )}

        {/* Ongoing Series */}
        {data.ongoing.length > 0 && (
          <AnimeSection
            title="Currently Airing & Ongoing"
            subtitle="Simulcast anime streaming weekly"
            iconName="compass"
            items={data.ongoing}
            viewAllHref="/genres"
          />
        )}

        {/* Top Rated Masterpieces */}
        {data.topCompleted && data.topCompleted.length > 0 && (
          <AnimeSection
            title="Top Rated Masterpieces"
            subtitle="Completed legendary series to binge from start to finish"
            iconName="star"
            items={data.topCompleted}
            viewAllHref="/genres"
            badge="Classics"
          />
        )}
      </div>
    </div>
  );
}
