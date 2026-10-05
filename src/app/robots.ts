import type { MetadataRoute } from "next";

/** The admin and API are never crawled. (The sitemap arrives with the SEO stage.) */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
  };
}
