import json
import re
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
from backend.app.core.config import settings
from backend.app.schemas.schemas import CustomerIntent, ActionType, Channel

logger = logging.getLogger(__name__)

# Try importing google.generativeai
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


class GeminiAdapter:
    """
    Adapter for Google Gemini Flash LLM.
    Handles structured reasoning, intent extraction, and conversational synthesis
    with built-in prompt-injection defenses and deterministic fallback.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-2.0-flash"
        self._client_ready = False

        if GENAI_AVAILABLE and self.api_key and not self.api_key.startswith("your_"):
            try:
                genai.configure(api_key=self.api_key)
                self._client_ready = True
                logger.info(f"Gemini LLM initialized successfully with model {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}. Running with fallback.")
        else:
            logger.info("No Gemini API key provided. Using deterministic fallback engine.")

    def _sanitize_input(self, text: str) -> str:
        """Sanitizes user input to mitigate prompt injection."""
        # Strip ASCII control characters except newline and tab
        sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
        # Escape potential delimiter attacks
        sanitized = sanitized.replace("<UNTRUSTED_CUSTOMER_INPUT>", "")
        sanitized = sanitized.replace("</UNTRUSTED_CUSTOMER_INPUT>", "")
        return sanitized.strip()

    async def extract_intent(self, customer_message: str, language: str = "Hindi") -> Tuple[CustomerIntent, float]:
        """
        Extracts customer intent from natural language message.
        Returns (CustomerIntent, confidence).
        """
        clean_msg = self._sanitize_input(customer_message)

        if self._client_ready:
            try:
                prompt = f"""You are a specialized intent classification engine for Paytm Collections.
Analyze the following customer message and classify it into EXACTLY ONE of the following intents:
- CONFIRM_PAYMENT: Customer asks how to pay or confirms they want payment link/QR code.
- PROMISE_TO_PAY: Customer promises to pay on a specific future date or time.
- DISPUTE_AMOUNT: Customer disputes the invoice amount or extra charges.
- DISPUTE_GOODS_SERVICES: Customer claims goods were defective, services not received, or order was returned.
- REQUEST_EXTENSION: Customer asks for more time due to temporary delay.
- FINANCIAL_HARDSHIP: Customer expresses severe financial distress, job loss, or illness.
- ALREADY_PAID: Customer asserts they have already made the payment.
- WRONG_NUMBER: Customer states this is the wrong person or phone number.
- REFUSAL_TO_PAY: Customer explicitly refuses to pay or is hostile.
- UNCLEAR_QUERY: General greeting or unclear question.

<UNTRUSTED_CUSTOMER_INPUT>
{clean_msg}
</UNTRUSTED_CUSTOMER_INPUT>

Respond ONLY with valid JSON in this exact structure:
{{"intent": "INTENT_NAME", "confidence": 0.95}}
"""
                model = genai.GenerativeModel(self.model_name)
                response = await model.generate_content_async(
                    prompt,
                    generation_config={"temperature": 0.1, "response_mime_type": "application/json"},
                )
                data = json.loads(response.text)
                intent_str = data.get("intent", "").upper()
                confidence = float(data.get("confidence", 0.9))
                if intent_str in CustomerIntent.__members__:
                    return CustomerIntent[intent_str], confidence
            except Exception as e:
                logger.warning(f"Gemini intent extraction failed ({e}), falling back to deterministic heuristic.")

        # Deterministic Heuristic Fallback
        return self._heuristic_intent_extraction(clean_msg)

    def _heuristic_intent_extraction(self, msg: str) -> Tuple[CustomerIntent, float]:
        """Deterministic rule-based intent classifier with high accuracy across Hindi & English."""
        m = msg.lower()

        # Dispute amount / goods & services (prioritized)
        if any(w in m for w in ["saman nahi mila", "kharab", "defective", "not delivered", "return kiya", "return kar diya", "goods issue", "damaged"]):
            return CustomerIntent.DISPUTE_GOODS_SERVICES, 0.92
        if any(w in m for w in ["galat bill", "wrong bill", "extra charge", "itne paise nahi", "galat amount", "dispute", "zyada charge"]):
            return CustomerIntent.DISPUTE_AMOUNT, 0.92

        # Already paid
        if any(w in m for w in ["already paid", "payment kar diya", "pay kar diya", "bhej diya", "ho gaya payment", "paid yesterday", "paise de diye", "chuka diya"]):
            return CustomerIntent.ALREADY_PAID, 0.95

        # Promise to pay
        if any(w in m for w in ["kal", "parso", "somwar", "friday", "monday", "tomorrow", "next week", "tarikh ko", "tareekh", "de dunga", "kar dunga", "pay on"]):
            return CustomerIntent.PROMISE_TO_PAY, 0.90

        # Financial hardship
        if any(w in m for w in ["job chali gayi", "nokri nahi hai", "salary nahi aayi", "medical emergency", "bimari", "paise nahi hain", "hospital", "financial problem"]):
            return CustomerIntent.FINANCIAL_HARDSHIP, 0.94

        # Request extension
        if any(w in m for w in ["thoda time", "kuch din", "time chahiye", "extension", "thodi der", "few days"]):
            return CustomerIntent.REQUEST_EXTENSION, 0.88

        # Confirm payment / link
        if any(w in m for w in ["link bhejo", "qr code", "kaise bharna", "how to pay", "payment link", "paytm se karu", "upi id"]):
            return CustomerIntent.CONFIRM_PAYMENT, 0.95

        # Wrong number
        if any(w in m for w in ["wrong number", "galat number", "main nahi hoon", "not me", "wrong person"]):
            return CustomerIntent.WRONG_NUMBER, 0.96

        # Refusal to pay
        if any(w in m for w in ["nahi dunga", "nahi bharta", "jo karna hai kar lo", "will not pay", "refuse to pay", "never"]):
            return CustomerIntent.REFUSAL_TO_PAY, 0.95

        return CustomerIntent.UNCLEAR_QUERY, 0.70

    async def decide_next_action(
        self,
        case_info: Dict[str, Any],
        customer_intent: CustomerIntent,
        memory_context: Optional[str] = None,
        language: str = "Hindi",
    ) -> Dict[str, Any]:
        """
        Determines the Next Best Action for the collection case.
        Returns bounded action (WAIT, TEXT, CALL, ESCALATE) with reasoning and message response.
        """
        # Formulate decision using deterministic business reasoning:
        outstanding = case_info.get("outstanding_amount", 0.0)
        customer_name = case_info.get("customer_name", "Customer")
        invoice_num = case_info.get("invoice_number", "")

        # 1. ALREADY_PAID: Action is WAIT or TEXT (send receipt/verify)
        if customer_intent == CustomerIntent.ALREADY_PAID:
            msg = (
                f"नमस्ते {customer_name} जी, भुगतान की सूचना देने के लिए धन्यवाद। "
                f"हम आपके इनवॉइस {invoice_num} के भुगतान की पुष्टि अपने सिस्टम में कर रहे हैं। "
                f"सत्यापन पूर्ण होते ही आपको रसीद भेज दी जाएगी।"
                if language == "Hindi" else
                f"Hello {customer_name}, thank you for updating us. We are verifying the payment for invoice {invoice_num} in our system. Once confirmed, your case will be closed."
            )
            return {
                "proposed_action": ActionType.TEXT.value,
                "confidence": 0.95,
                "reason": "Customer states payment already made; initiate payment gateway verification and inform customer.",
                "message_content": msg,
                "scheduled_follow_up_hours": 1,
            }

        # 2. CONFIRM_PAYMENT: Action is TEXT with instant payment link / QR
        if customer_intent == CustomerIntent.CONFIRM_PAYMENT:
            msg = (
                f"नमस्ते {customer_name} जी, इनवॉइस {invoice_num} की बकाया राशि ₹{outstanding:,.2f} है। "
                f"आप इस सुरक्षित लिंक से तुरंत भुगतान कर सकते हैं: https://paytm.com/pay/{invoice_num} "
                f"भुगतान के बाद तुरंत कन्फर्मेशन प्राप्त होगा।"
                if language == "Hindi" else
                f"Hello {customer_name}, your outstanding amount for invoice {invoice_num} is ₹{outstanding:,.2f}. Please complete your payment securely at: https://paytm.com/pay/{invoice_num}."
            )
            return {
                "proposed_action": ActionType.TEXT.value,
                "confidence": 0.95,
                "reason": "Customer requested payment method; provide instant secure payment link.",
                "message_content": msg,
                "scheduled_follow_up_hours": 24,
            }

        # 3. PROMISE_TO_PAY: Action is WAIT until commitment date + confirmation text
        if customer_intent == CustomerIntent.PROMISE_TO_PAY:
            msg = (
                f"धन्यवाद {customer_name} जी। हमने आपके द्वारा दी गई तारीख का वादा नोट कर लिया है। "
                f"कृपया उस दिन तक इनवॉइस {invoice_num} का भुगतान सुनिश्चित करें। हम उस दिन आपको एक रिमाइंडर भेजेंगे।"
                if language == "Hindi" else
                f"Thank you {customer_name}. We have noted your promise to pay for invoice {invoice_num}. We will send a polite reminder on the promised date."
            )
            return {
                "proposed_action": ActionType.TEXT.value,
                "confidence": 0.92,
                "reason": "Customer offered promise to pay; acknowledge commitment and schedule reminder.",
                "message_content": msg,
                "scheduled_follow_up_hours": 48,
            }

        # 4. DISPUTE (Amount or Goods): Action is ESCALATE
        if customer_intent in (CustomerIntent.DISPUTE_AMOUNT, CustomerIntent.DISPUTE_GOODS_SERVICES):
            msg = (
                f"नमस्ते {customer_name} जी, आपकी समस्या हमने नोट कर ली है। "
                f"आपकी इनवॉइस {invoice_num} की समीक्षा के लिए इसे हमारे सीनियर मैनेजर को सौंपा जा रहा है। "
                f"हमारी टीम आपसे 24 घंटे के भीतर संपर्क करेगी और जांच पूरी होने तक संग्रह रोक दिया गया है।"
                if language == "Hindi" else
                f"Hello {customer_name}, we have logged your dispute regarding invoice {invoice_num}. Your case is escalated to our billing manager. Automated outreach is paused while we review."
            )
            return {
                "proposed_action": ActionType.ESCALATE.value,
                "confidence": 0.96,
                "reason": "Customer raised legitimate invoice dispute; mandatory escalation to human manager with outreach freeze.",
                "message_content": msg,
                "escalation_reason": "CUSTOMER_DISPUTE",
            }

        # 5. FINANCIAL HARDSHIP: Action is ESCALATE or offer regulated payment plan
        if customer_intent == CustomerIntent.FINANCIAL_HARDSHIP:
            msg = (
                f"नमस्ते {customer_name} जी, आपकी परेशानी को हम समझते हैं। "
                f"हम आपके इनवॉ आसान किश्तों (EMI) या एक्सटेंशन के विकल्प के लिए हमारे वरिष्ठ अधिकारी से बात करवा रहे हैं ताकि आपको सुविधा हो सके।"
                if language == "Hindi" else
                f"Hello {customer_name}, we understand your situation. We are routing your case to a relief specialist to discuss manageable installment options."
            )
            return {
                "proposed_action": ActionType.ESCALATE.value,
                "confidence": 0.90,
                "reason": "Customer reported financial hardship; route to human specialist for compassionate restructuring.",
                "message_content": msg,
                "escalation_reason": "FINANCIAL_HARDSHIP",
            }

        # 6. WRONG NUMBER / REFUSAL: Action is ESCALATE
        if customer_intent in (CustomerIntent.WRONG_NUMBER, CustomerIntent.REFUSAL_TO_PAY):
            msg = (
                f"नमस्ते, आपकी जानकारी दर्ज कर ली गई है। हमारी टीम संपर्क विवरण की जांच करेगी।"
                if language == "Hindi" else
                f"Thank you. Your feedback has been noted and our records will be reviewed."
            )
            return {
                "proposed_action": ActionType.ESCALATE.value,
                "confidence": 0.95,
                "reason": f"Customer intent is {customer_intent.value}; automated agent cannot resolve, escalate to human supervisor.",
                "message_content": msg,
                "escalation_reason": customer_intent.value,
            }

        # Default: Gentle reminder
        msg = (
            f"नमस्ते {customer_name} जी, राज इलेक्ट्रॉनिक्स से इनवॉइस {invoice_num} (राशि ₹{outstanding:,.2f}) के भुगतान हेतु यह संदेश है। "
            f"कृपया समय पर भुगतान कर पेनल्टी से बचें। लिंक: https://paytm.com/pay/{invoice_num}"
            if language == "Hindi" else
            f"Hello {customer_name}, this is a gentle reminder regarding invoice {invoice_num} for ₹{outstanding:,.2f}. Pay online: https://paytm.com/pay/{invoice_num}"
        )
        return {
            "proposed_action": ActionType.TEXT.value,
            "confidence": 0.85,
            "reason": "Standard reminder outreach to contactable customer.",
            "message_content": msg,
            "scheduled_follow_up_hours": 24,
        }


gemini_adapter = GeminiAdapter()
