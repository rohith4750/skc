import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export function generateId(): string {
  return uuidv4();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' && date.includes('-') && !date.includes('T') ? new Date(date + 'T00:00:00') : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(time: string): string {
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM') || time.includes('am') || time.includes('pm')) {
    return time;
  }
  const parts = time.split(':');
  if (parts.length < 2) return time;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (isNaN(hours)) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedHours = displayHours.toString().padStart(2, '0');
  return `${formattedHours}:${minutes} ${period}`;
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getOrderDate(order: any): string | Date {
  if (!order) return new Date();
  return order.eventDate || order.createdAt;
}

/**
 * Returns the current date in YYYY-MM-DD format based on the user's local timezone.
 * This fixes the issue where `new Date().toISOString().split('T')[0]` returns yesterday's date
 * when the local time is past midnight but UTC is still on the previous day.
 */
export function getLocalISODate(): string {
  const date = new Date();
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().split("T")[0];
}

export function sendEmail(email: string, subject: string, message: string) {
  // Free email sending using mailto: protocol
  // This opens the user's default email client with pre-filled content
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  window.open(mailtoLink);
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  let cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
  if (cleanPhone.length === 10 && !cleanPhone.startsWith("91")) {
    cleanPhone = "91" + cleanPhone;
  }
  if (cleanPhone.startsWith("0")) {
    cleanPhone = cleanPhone.substring(1);
  }

  const toastId = toast.loading("Sending WhatsApp message directly to customer...");

  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, message }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("✅ WhatsApp message delivered directly to customer!", { id: toastId });
      return true;
    }

    // Fallback if Meta API is unconfigured or test token expired
    console.warn("Meta API Send warning:", data);
    toast.info("Opening WhatsApp fallback...", { id: toastId });

    const fallbackUrl = data.fallbackUrl || `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(fallbackUrl, "_blank");
    return false;
  } catch (error: any) {
    console.error("Error sending WhatsApp message via API:", error);
    toast.error("Failed to connect to WhatsApp API. Opening fallback...", { id: toastId });
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(fallbackUrl, "_blank");
    return false;
  }
}

export function sendSMS(phone: string, message: string) {
  // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
  // For now, use sms: protocol
  const smsLink = `sms:${phone}?body=${encodeURIComponent(message)}`;
  window.location.href = smsLink;
}

export function sanitizeMealLabel(label: string): string {
  if (!label) return "";

  let workingLabel = String(label);

  // If it's a long string with hyphens (likely a UUID), return generic label
  if (workingLabel.length > 20 && workingLabel.includes("-")) return "Meal";

  if (workingLabel === "special_order") return "Special Order";

  // Strip tracking suffixes like session_NAME_serial
  if (workingLabel.startsWith("session_")) {
    const parts = workingLabel.split("_");
    if (parts.length > 1 && parts[1] !== "merged") {
      workingLabel = parts[1];
    } else {
      workingLabel = "Meal";
    }
  }

  // Handle merged suffixes
  if (workingLabel.toLowerCase().includes("_merged")) {
    workingLabel = workingLabel.split("_")[0];
  }

  const cleanLabel = workingLabel.split("_")[0];
  // If still too long, it's likely a technical ID
  if (cleanLabel.length > 20) return "Meal";

  // Capitalize for consistent display
  return cleanLabel.charAt(0).toUpperCase() + cleanLabel.slice(1).toLowerCase();
}
