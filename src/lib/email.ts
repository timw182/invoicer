import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const profile = await prisma.businessProfile.findFirst();
  if (!profile?.smtpHost || !profile?.smtpUser || !profile?.smtpPass) {
    return null;
  }
  return {
    host: profile.smtpHost,
    port: profile.smtpPort,
    secure: profile.smtpSecure,
    user: profile.smtpUser,
    pass: profile.smtpPass,
    from: profile.smtpFrom || profile.email || profile.smtpUser,
  };
}

function createTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
}

function formatDateStr(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy");
}

function baseHtml(businessName: string, accentColor: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:${accentColor};color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
      <h1 style="margin:0;font-size:20px;font-weight:600">${businessName}</h1>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e4e4e7;border-top:0">
      ${body}
    </div>
    <p style="text-align:center;font-size:12px;color:#a1a1aa;margin-top:16px">
      Sent by ${businessName}
    </p>
  </div>
</body>
</html>`;
}

interface InvoiceForEmail {
  id: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  issueDate: Date | string;
  dueDate: Date | string;
  clientName: string;
  supplierName: string;
  status: string;
  notes?: string | null;
}

export async function sendInvoiceEmail(
  invoice: InvoiceForEmail,
  clientEmail: string
): Promise<boolean> {
  const config = await getSmtpConfig();
  if (!config) {
    console.warn("SMTP not configured, skipping email");
    return false;
  }

  const profile = await prisma.businessProfile.findFirst();
  const accentColor = profile?.accentColor || "#1e40af";

  const body = `
    <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">Invoice ${invoice.invoiceNumber}</h2>
    <p style="color:#52525b;margin:0 0 16px;line-height:1.6">
      Dear ${invoice.clientName},<br><br>
      Please find attached your invoice details below.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="border-bottom:1px solid #e4e4e7">
        <td style="padding:8px 0;color:#71717a;font-size:14px">Invoice Number</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-size:14px">${invoice.invoiceNumber}</td>
      </tr>
      <tr style="border-bottom:1px solid #e4e4e7">
        <td style="padding:8px 0;color:#71717a;font-size:14px">Issue Date</td>
        <td style="padding:8px 0;text-align:right;font-size:14px">${formatDateStr(invoice.issueDate)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e4e4e7">
        <td style="padding:8px 0;color:#71717a;font-size:14px">Due Date</td>
        <td style="padding:8px 0;text-align:right;font-size:14px">${formatDateStr(invoice.dueDate)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#71717a;font-size:14px;font-weight:600">Total Amount</td>
        <td style="padding:12px 0;text-align:right;font-weight:700;font-size:18px;color:${accentColor}">${formatCurrency(invoice.total, invoice.currency)}</td>
      </tr>
    </table>
    ${invoice.notes ? `<p style="color:#71717a;font-size:13px;margin:16px 0 0;padding:12px;background:#f4f4f5;border-radius:6px">${invoice.notes}</p>` : ""}
    <p style="color:#52525b;margin:24px 0 0;font-size:14px;line-height:1.6">
      Please ensure payment is made by <strong>${formatDateStr(invoice.dueDate)}</strong>.<br>
      Thank you for your business.
    </p>`;

  const transport = createTransport(config);

  try {
    await transport.sendMail({
      from: config.from,
      to: clientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.supplierName}`,
      html: baseHtml(invoice.supplierName, accentColor, body),
    });
    return true;
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return false;
  }
}

export async function sendReminderEmail(
  invoice: InvoiceForEmail,
  clientEmail: string,
  reminderType: "upcoming" | "overdue" | "overdue_followup"
): Promise<boolean> {
  const config = await getSmtpConfig();
  if (!config) {
    console.warn("SMTP not configured, skipping reminder email");
    return false;
  }

  const profile = await prisma.businessProfile.findFirst();
  const accentColor = profile?.accentColor || "#1e40af";

  const isOverdue = reminderType !== "upcoming";
  const subject = isOverdue
    ? `Payment overdue: Invoice ${invoice.invoiceNumber}`
    : `Payment reminder: Invoice ${invoice.invoiceNumber}`;

  const heading = isOverdue ? "Payment Overdue" : "Friendly Payment Reminder";
  const message = isOverdue
    ? `This is a reminder that invoice <strong>${invoice.invoiceNumber}</strong> was due on <strong>${formatDateStr(invoice.dueDate)}</strong> and remains unpaid. Please arrange payment at your earliest convenience.`
    : `This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> is due on <strong>${formatDateStr(invoice.dueDate)}</strong>.`;

  const urgencyColor = isOverdue ? "#dc2626" : "#f59e0b";

  const body = `
    <div style="padding:12px 16px;background:${urgencyColor}10;border-left:4px solid ${urgencyColor};border-radius:4px;margin-bottom:16px">
      <h2 style="margin:0;font-size:16px;color:${urgencyColor}">${heading}</h2>
    </div>
    <p style="color:#52525b;margin:0 0 16px;line-height:1.6">
      Dear ${invoice.clientName},<br><br>
      ${message}
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr style="border-bottom:1px solid #e4e4e7">
        <td style="padding:8px 0;color:#71717a;font-size:14px">Invoice</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-size:14px">${invoice.invoiceNumber}</td>
      </tr>
      <tr style="border-bottom:1px solid #e4e4e7">
        <td style="padding:8px 0;color:#71717a;font-size:14px">Due Date</td>
        <td style="padding:8px 0;text-align:right;font-size:14px;color:${isOverdue ? "#dc2626" : "inherit"}">${formatDateStr(invoice.dueDate)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;color:#71717a;font-size:14px;font-weight:600">Amount Due</td>
        <td style="padding:12px 0;text-align:right;font-weight:700;font-size:18px;color:${urgencyColor}">${formatCurrency(invoice.total, invoice.currency)}</td>
      </tr>
    </table>
    <p style="color:#52525b;margin:24px 0 0;font-size:14px;line-height:1.6">
      If you have already made the payment, please disregard this message.<br>
      Thank you.
    </p>`;

  const transport = createTransport(config);

  try {
    await transport.sendMail({
      from: config.from,
      to: clientEmail,
      subject: `${subject} from ${invoice.supplierName}`,
      html: baseHtml(invoice.supplierName, accentColor, body),
    });
    return true;
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return false;
  }
}

export async function isSmtpConfigured(): Promise<boolean> {
  const config = await getSmtpConfig();
  return config !== null;
}
