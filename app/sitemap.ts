import { MetadataRoute } from "next";
import { allZones } from "@/lib/zones";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ukcleanzone.co.uk";
  const now = new Date();

  // Root Homepage
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Programmatic SEO Zone Pages
  allZones.forEach((zone) => {
    routes.push({
      url: `${baseUrl}/zone/${zone.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    });
  });

  return routes;
}
