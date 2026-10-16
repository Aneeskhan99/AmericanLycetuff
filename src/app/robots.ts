import type { MetadataRoute } from "next";

/**
 * /robots.txt
 * - Everything is crawlable except enquiry-form variants with tracking/query
 *   parameters (/enquire?type=...), which are kept out of search results.
 * - The admin and API are never crawled (they also send noindex headers).
 * - Sitemap: public/sitemap.xml (the same list is also at /sitemap-aml.xml).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/*?type=", "/admin", "/api/"] }],
    sitemap: "https://swabi.americanlycetuffdnk.edu.pk/sitemap.xml",
  };
}
