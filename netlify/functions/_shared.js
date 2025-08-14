// netlify/functions/_shared.js
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36";

function badRequest(msg) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

async function proxyFetch(url, params) {
  const u = new URL(url);
  Object.entries(params || {}).forEach(([k, v]) => u.searchParams.set(k, v));

  const res = await fetch(u.toString(), {
    headers: {
      "user-agent": UA,
      accept: "application/json;odata=verbose",
      referer: "https://www.charities.govt.nz/",
    },
    // Netlify functions run server-side; no CORS preflight needed
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(
      JSON.stringify({ error: "Upstream failed", detail: text }),
      { status: res.status, headers: { "content-type": "application/json" } }
    );
  }

  const body = await res.text();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300",
    },
  });
}

export { badRequest, proxyFetch };
