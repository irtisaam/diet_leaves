"""
Email service — sends transactional emails via SMTP.
Fails silently when SMTP is not configured so the app still works without it.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Diet Leaves")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@dietleaves.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def _send(to: str, subject: str, html_body: str):
    """Low-level send via SMTP. No-op when SMTP is not configured."""
    if not _smtp_configured():
        print(f"[EMAIL] SMTP not configured — skipping email to {to}: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM_EMAIL, to, msg.as_string())
    print(f"[EMAIL] Sent '{subject}' to {to}")


# ───────── Password Reset ─────────

def send_password_reset_email(email: str, token: str):
    reset_url = f"{FRONTEND_URL}/account/reset-password?token={token}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2 style="color:#10B981;">Diet Leaves</h2>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="{reset_url}"
           style="display:inline-block;padding:12px 24px;background:#10B981;color:#fff;
                  text-decoration:none;border-radius:6px;margin:16px 0;font-weight:bold;">
           Reset Password
        </a>
        <p style="color:#888;font-size:13px;">If you didn't request this, simply ignore this email.</p>
    </div>
    """
    _send(email, "Reset your Diet Leaves password", html)


# ───────── Order Placed ─────────

def send_order_placed_email(email: str, order_number: str, total: float, items_summary: str):
    track_url = f"{FRONTEND_URL}/checkout/success?order={order_number}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2 style="color:#10B981;">Diet Leaves</h2>
        <h3>Order Confirmed! 🎉</h3>
        <p>Thank you for your order <strong>#{order_number}</strong>.</p>
        <p><strong>Total:</strong> Rs {total:.0f}</p>
        <div style="background:#f9f9f9;padding:12px;border-radius:6px;margin:12px 0;">
            {items_summary}
        </div>
        <a href="{track_url}"
           style="display:inline-block;padding:12px 24px;background:#10B981;color:#fff;
                  text-decoration:none;border-radius:6px;margin:16px 0;font-weight:bold;">
           View Order
        </a>
        <p style="color:#888;font-size:13px;">You'll receive updates as your order progresses.</p>
    </div>
    """
    _send(email, f"Order #{order_number} Confirmed — Diet Leaves", html)


# ───────── Order Status Changed ─────────

def send_order_status_email(email: str, order_number: str, new_status: str, tracking_number: Optional[str] = None):
    status_labels = {
        "processing": "is being processed",
        "shipped": "has been shipped",
        "delivered": "has been delivered",
        "cancelled": "has been cancelled",
    }
    label = status_labels.get(new_status, f"status is now: {new_status}")
    tracking_html = ""
    if tracking_number:
        tracking_html = f"<p><strong>Tracking Number:</strong> {tracking_number}</p>"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
        <h2 style="color:#10B981;">Diet Leaves</h2>
        <h3>Order Update</h3>
        <p>Your order <strong>#{order_number}</strong> {label}.</p>
        {tracking_html}
        <a href="{FRONTEND_URL}/account"
           style="display:inline-block;padding:12px 24px;background:#10B981;color:#fff;
                  text-decoration:none;border-radius:6px;margin:16px 0;font-weight:bold;">
           View Account
        </a>
    </div>
    """
    subject_map = {
        "shipped": f"Order #{order_number} Shipped",
        "delivered": f"Order #{order_number} Delivered!",
    }
    subject = subject_map.get(new_status, f"Order #{order_number} — Status Update")
    _send(email, subject, html)
