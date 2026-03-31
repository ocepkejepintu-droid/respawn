import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/dashboard/",
          "/competitors/",
          "/audience/",
          "/briefing/",
          "/optimize/",
          "/private/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/dashboard/",
          "/competitors/",
          "/audience/",
          "/briefing/",
          "/optimize/",
        ],
      },
    ],
    sitemap: "https://realbuzzer.com/sitemap.xml",
    host: "https://realbuzzer.com",
  };
}
