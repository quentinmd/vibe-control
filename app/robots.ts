import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/host", "/logout", "/guest/", "/api/"],
      },
    ],
    sitemap: "https://vibecontrol.live/sitemap.xml",
    host: "https://vibecontrol.live",
  };
}
