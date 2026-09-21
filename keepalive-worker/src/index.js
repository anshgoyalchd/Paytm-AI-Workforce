export default {
  async scheduled(event, env, ctx) {
    console.log("Keepalive scheduled trigger at", new Date().toISOString());
    try {
      const res = await fetch("https://paytm-collections-backend.onrender.com/health");
      console.log("Render response status:", res.status);
    } catch (err) {
      console.error("Keepalive ping failed:", err);
    }
  },
  async fetch(request, env, ctx) {
    try {
      const t0 = Date.now();
      const res = await fetch("https://paytm-collections-backend.onrender.com/health");
      const duration = Date.now() - t0;
      const data = await res.json();
      return new Response(
        JSON.stringify({ status: "OK", duration_ms: duration, backend: data }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ status: "ERROR", error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
