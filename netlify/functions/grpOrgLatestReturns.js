// netlify/functions/grpOrgLatestReturns.js
import { badRequest, proxyFetch } from "./_shared.js";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const url = new URL(req.url);
  const cc = (url.searchParams.get("cc") || "").toUpperCase().trim();

  if (!(cc.startsWith("CC") && /^\d+$/.test(cc.slice(2)))) {
    return badRequest("Bad CC parameter");
  }

  const upstream = "https://www.odata.charities.govt.nz/GrpOrgLatestReturns";
  const params = {
    "$filter": `CharityRegistrationNumber eq '${cc}'`,
    "$format": "json",
  };

  return proxyFetch(upstream, params);
};
