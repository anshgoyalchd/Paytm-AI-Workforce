export async function onRequestPost(context) {
  const { request } = context;
  try {
    const formData = await request.formData();
    const fromPhone = formData.get("From") || "";
    const bodyText = formData.get("Body") || "";

    // Asynchronously forward to Render backend so database and Cognee memory are recorded
    fetch("https://paytm-collections-backend.onrender.com/api/webhooks/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    }).catch(() => {});

    // Contextual payment reply in Hindi with exact invoice details
    let reply = "नमस्ते Ansh जी! पेटीएम कलेक्शंस से आवश्यक स्मरण पत्र: इनवॉइस संख्या 5r67586 (बकाया ₹50,000) लंबित है। कृपया सुरक्षित Paytm UPI द्वारा भुगतान करें: https://paytm.com/pay/5r67586 धन्यवाद!";

    const lower = bodyText.toLowerCase();
    if (lower.includes("link") || lower.includes("pay") || lower.includes("bhejo") || lower.includes("bhugtan")) {
      reply = "नमस्ते Ansh जी! आपका इनवॉइस 5r67586 का बकाया ₹50,000 है। सुरक्षित भुगतान हेतु Paytm UPI लिंक: https://paytm.com/pay/5r67586 धन्यवाद!";
    } else if (lower.includes("paid") || lower.includes("de diya") || lower.includes("done")) {
      reply = "धन्यवाद Ansh जी! आपके भुगतान दावे को हमने नोट कर लिया है और हम बैंक गेटवे से पुष्टि कर रहे हैं।";
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${reply}</Message>
</Response>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>नमस्ते! आपका संदेश प्राप्त हुआ है। पेटीएम कलेक्शंस टीम आपसे जल्द ही संपर्क करेगी।</Message>
</Response>`;
    return new Response(fallbackXml, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
