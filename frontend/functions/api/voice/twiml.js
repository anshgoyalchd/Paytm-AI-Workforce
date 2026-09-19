export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  let rawText = url.searchParams.get("text") || "नमस्ते! मैं Paytm AI असिस्टेंट से बात कर रही हूँ। आपका इनवॉइस पेमेंट पेंडिंग है, कृपया अपने फोन पर भेजे गए लिंक से पेमेंट कम्पलीट कर लें। धन्यवाद।";
  
  // Strip URLs so telephony NEVER spells out http / dot com / slash letter by letter
  rawText = rawText.replace(/https?:\/\/[^\s]+/gi, "पेमेंट का लिंक आपके मोबाइल और ईमेल पर भेज दिया गया है।");
  // Clean decimal amounts (e.g. ₹50,000.00 -> 50,000 रुपये)
  rawText = rawText.replace(/₹\s*([0-9,]+)(\.[0-9]+)?/g, "$1 रुपये");

  // XML escaping to ensure valid TwiML
  const escapedText = rawText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="1"/>
    <Say voice="Polly.Aditi" language="hi-IN">${escapedText}</Say>
    <Pause length="1"/>
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
