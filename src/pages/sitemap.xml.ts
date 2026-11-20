import type { APIRoute } from "astro";
import { sitemapXml } from "../config/indexacao";

export const GET: APIRoute = () =>
  new Response(sitemapXml(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
