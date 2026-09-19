import logging
from typing import Dict, Any, Optional
import httpx
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class EmailAdapter:
    """
    Email Communication Adapter using Resend API.
    Sends responsive, high-deliverability Paytm Collections notices.
    """

    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL or "Paytm Collections <onboarding@resend.dev>"
        self.base_url = "https://api.resend.com/emails"

    def _build_html_template(
        self,
        customer_name: str,
        invoice_number: str,
        amount: float,
        due_date_str: str,
        pay_link: str,
        language: str = "Hindi",
        business_name: str = "Paytm Merchant Services",
    ) -> str:
        formatted_amount = f"₹{amount:,.2f}"

        if language == "Hindi":
            greeting = f"नमस्ते {customer_name} जी,"
            subject_sub = "बकाया भुगतान सूचना"
            message_body = (
                f"आपके इनवॉइस <strong>{invoice_number}</strong> का बकाया <strong>{formatted_amount}</strong> "
                f"लंबित है (नियत तिथि: {due_date_str})। व्यवसाय निरंतरता हेतु कृपया Paytm UPI द्वारा तुरंत भुगतान करें।"
            )
            cta_text = f"{formatted_amount} का अभी भुगतान करें (Paytm UPI)"
            details_heading = "बिल एवं इनवॉइस विवरण"
        else:
            greeting = f"Dear {customer_name},"
            subject_sub = "Payment Reminder Notice"
            message_body = (
                f"Your invoice <strong>{invoice_number}</strong> from <strong>{business_name}</strong> for "
                f"<strong>{formatted_amount}</strong> is currently pending (Due Date: {due_date_str}). "
                f"Please clear your outstanding balance securely via Paytm UPI."
            )
            cta_text = f"Pay {formatted_amount} Now (Paytm UPI)"
            details_heading = "Invoice & Account Details"

        return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paytm Collections Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 41, 112, 0.06);">
                    
                    <!-- Paytm Header -->
                    <tr>
                        <td style="background-color: #002970; padding: 24px 32px; text-align: center;">
                            <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                Paytm <span style="color: #00BAF2; font-weight: 600;">Workforce</span>
                            </div>
                            <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; font-weight: 600;">
                                {subject_sub} &bull; Official Notice
                            </div>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                                {greeting}
                            </h2>

                            <p style="margin: 0 0 24px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                                {message_body}
                            </p>

                            <!-- Invoice Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                                        <div style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">
                                            {details_heading}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; color: #334155;">
                                            <tr>
                                                <td style="color: #64748b; padding-left: 0;">Invoice Number:</td>
                                                <td align="right" style="font-weight: 600; color: #0f172a; font-family: monospace;">{invoice_number}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #64748b; padding-left: 0;">Merchant:</td>
                                                <td align="right" style="font-weight: 600; color: #0f172a;">{business_name}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #64748b; padding-left: 0;">Due Date:</td>
                                                <td align="right" style="color: #dc2626; font-weight: 600;">{due_date_str}</td>
                                            </tr>
                                            <tr style="border-top: 1px dashed #cbd5e1;">
                                                <td style="color: #0f172a; font-weight: 700; font-size: 14px; padding-top: 12px; padding-left: 0;">Total Balance Due:</td>
                                                <td align="right" style="font-weight: 800; color: #002970; font-size: 18px; padding-top: 12px;">{formatted_amount}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0 20px 0;">
                                <a href="{pay_link}" target="_blank" style="background-color: #00BAF2; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(0, 186, 242, 0.25);">
                                    {cta_text}
                                </a>
                            </div>

                            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin: 0;">
                                Direct UPI Link: <a href="{pay_link}" style="color: #002970; word-break: break-all;">{pay_link}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
                            <p style="margin: 0; color: #64748b; font-size: 11px; line-height: 1.5;">
                                This is an automated collection notification from the <strong>Paytm AI Workforce Platform</strong>.<br/>
                                All payments are processed securely via Paytm UPI / Payment Gateway.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""

    async def send_collection_email(
        self,
        to_email: str,
        customer_name: str,
        invoice_number: str,
        amount: float,
        due_date_str: str = "Immediate",
        pay_link: str = "https://paytm.com",
        language: str = "Hindi",
        business_name: str = "Paytm Merchant Services",
    ) -> Dict[str, Any]:
        """
        Sends an automated collection email using Resend API.
        """
        target_email = to_email if to_email and "@" in to_email else "ansh.goyalchd@gmail.com"

        subject = (
            f"Paytm Collections: इनवॉइस {invoice_number} का बकाया ₹{amount:,.0f} लंबित है"
            if language == "Hindi"
            else f"Paytm Collections: Overdue Invoice {invoice_number} - Balance ₹{amount:,.0f}"
        )

        html_body = self._build_html_template(
            customer_name=customer_name,
            invoice_number=invoice_number,
            amount=amount,
            due_date_str=due_date_str,
            pay_link=pay_link,
            language=language,
            business_name=business_name,
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "from": self.from_email,
            "to": [target_email],
            "subject": subject,
            "html": html_body,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(self.base_url, headers=headers, json=payload)
                data = res.json()

                if res.status_code in (200, 201):
                    msg_id = data.get("id")
                    logger.info(f"[EMAIL] Collection email dispatched to {target_email}. Message ID: {msg_id}")
                    return {
                        "success": True,
                        "provider": "RESEND",
                        "provider_message_id": msg_id,
                        "status": "DELIVERED",
                        "to": target_email,
                        "subject": subject,
                    }
                else:
                    err_msg = data.get("message") or res.text
                    logger.error(f"[EMAIL] Resend delivery failed ({res.status_code}): {err_msg}")
                    return {
                        "success": False,
                        "provider": "RESEND",
                        "status": "FAILED",
                        "error": err_msg,
                        "to": target_email,
                    }
        except Exception as e:
            logger.exception(f"[EMAIL] Exception during email dispatch: {e}")
            return {
                "success": False,
                "provider": "RESEND",
                "status": "FAILED",
                "error": str(e),
                "to": target_email,
            }


email_adapter = EmailAdapter()
