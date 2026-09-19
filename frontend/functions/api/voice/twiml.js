export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const rawText = url.searchParams.get("text") || "नमस्ते, यह पेटीएम कलेक्शंस से आवश्यक स्मरण पत्र है। आपका इनवॉइस भुगतान लंबित है, कृपया शीघ्र भुगतान करें। धन्यवाद।";
  
  // XML escaping to ensure valid TwiML
  const escapedText = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="hi-IN">${escapedText}</Say>
</Response>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
