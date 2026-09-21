export async function onRequest(context) {
  const start = Date.now();
  const backendUrl = "https://paytm-collections-backend.onrender.com/health";

  try {
    // 55-second timeout to allow cold-start container spin-up on Render
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(backendUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Paytm-Cloudflare-Warmup/1.0",
        "Accept": "application/json",
      },
    });
    clearTimeout(timeoutId);

    const duration = Date.now() - start;
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = { text: "non-json response" };
    }

    return new Response(
      JSON.stringify({
        status: response.ok ? "WARM" : "DEGRADED",
        http_code: response.status,
        latency_ms: duration,
        timestamp: new Date().toISOString(),
        backend: body,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    const duration = Date.now() - start;
    return new Response(
      JSON.stringify({
        status: "ERROR",
        message: err.name === "AbortError" ? "Timeout waiting for backend to wake" : err.message,
        latency_ms: duration,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 504,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
