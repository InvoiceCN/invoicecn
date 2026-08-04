import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
  Link,
} from "@react-email/components";

import { createEmailTailwindConfig } from "@/components/email/email-theme";
import { defaultTheme } from "@/components/email/theme-default";
import { DefaultFonts } from "@/components/email/font-default";

export interface ReceiptInvoiceLine {
  /** Invoice number, e.g. ACME-20260531 */
  ref: string;
  /** Amount applied to this invoice, in the receipt's currency */
  amount: number;
  /**
   * How far this payment settles the invoice.
   * "full" clears it; "partial" leaves a balance outstanding.
   * Defaults to "full".
   */
  settlement?: "full" | "partial";
}

export interface PaymentReceipt {
  receiptNo: string;
  /** Human-readable payment date, e.g. "August 3, 2026" */
  paidOn: string;
  /** ISO 4217 code — drives amount formatting */
  currency: string;
  /** e.g. "Interac e-Transfer", "Bank transfer" */
  method: string;
  /** Address / account the payment was sent to */
  methodDetail?: string;
  /** Identifier for the payment transaction itself, e.g. PMT-ACME-20260803 */
  paymentId?: string;
  /** Statement this payment settles, if any */
  statementNo?: string;
  billTo: {
    company: string;
    attn?: string;
    email?: string;
  };
  invoices: ReceiptInvoiceLine[];
}

const money = (amount: number, currency: string) =>
  amount.toLocaleString("en-US", { style: "currency", currency });

/** Human label for how far a payment settles an invoice. */
const settlementLabel = (line: ReceiptInvoiceLine) =>
  (line.settlement ?? "full") === "partial" ? "Partial" : "Paid in full";

const VENDOR = {
  name: "Example Studio",
  address: "100 Example Street, Laval, QC H7T-3B5",
  tax: "GST 000000000RT0001 · QST 0000000000TQ0001",
  billing: "billing@example.com",
};

/**
 * Content-ID of the inline logo attachment.
 *
 * The logo ships as an inline attachment rather than a hosted URL: remote
 * images are blocked by default in most clients, so a `cid:` reference is the
 * only way the mark renders without the recipient clicking "show images".
 * The sender MUST attach `assets/logo.png` with this exact Content-ID.
 */
export const LOGO_CID = "invoicecn-logo";

/**
 * invoicecn payment receipt.
 *
 * Composed from emailcn's React Email primitives and `theme-default` (installed
 * from the @emailcn registry). We do not use `block-receipt-default` directly:
 * that block renders its own <Html> document and drops everything except
 * order/items/totals, so the payment method — the one fact a receipt must
 * state — cannot be shown through it.
 */
export function PaymentReceiptEmail(receipt: PaymentReceipt) {
  const total = receipt.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalFmt = money(total, receipt.currency);
  const paidVia = [receipt.method, receipt.methodDetail]
    .filter(Boolean)
    .join(" · ");

  return (
    <Html>
      <Head>
        <DefaultFonts />
      </Head>
      <Preview>{`Receipt ${receipt.receiptNo} — ${totalFmt} received, paid in full`}</Preview>
      <Tailwind config={createEmailTailwindConfig(defaultTheme)}>
        <Body className="bg-background font-sans">
          <Container className="mx-auto max-w-container p-8">
            <Section className="pt-10 pb-2">
              <Img
                src={`cid:${LOGO_CID}`}
                alt={VENDOR.name}
                width="48"
                height="48"
                className="h-12 w-12"
              />
            </Section>

            <Section className="pt-4 pb-6">
              <Text className="mb-1 text-3xl font-bold tracking-tight text-foreground">
                Payment received
              </Text>
              <Text className="mb-0 text-base text-foreground-muted">
                Receipt {receipt.receiptNo} · {receipt.billTo.company}
              </Text>
            </Section>

            <Section className="rounded-lg bg-background-muted p-6">
              <Text className="my-0 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                {receipt.paymentId ? `Amount (${receipt.paymentId})` : "Amount"}
              </Text>
              <Text className="mt-1 mb-0 text-3xl font-bold tracking-tight text-foreground">
                {totalFmt}
              </Text>
              <Text className="mt-1 mb-0 text-sm text-foreground-muted">
                Paid {receipt.paidOn} · {paidVia}
              </Text>
            </Section>

            <Hr className="my-6 border-border" />

            <Section>
              <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Invoices settled
              </Text>
              {receipt.invoices.map((inv) => (
                <Row key={inv.ref} className="mb-2">
                  <Column>
                    <Text className="my-0 text-base font-medium text-foreground">
                      {inv.ref}
                      <span className="ml-2 text-xs font-normal text-foreground-muted">
                        {settlementLabel(inv)}
                      </span>
                    </Text>
                  </Column>
                  <Column align="right">
                    <Text className="my-0 text-right text-base font-medium text-foreground">
                      {money(inv.amount, receipt.currency)}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr className="my-4 border-border" />

            <Section>
              <Row>
                <Column>
                  <Text className="my-1 text-base text-foreground-muted">
                    Balance
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="my-1 text-right text-base font-medium text-foreground">
                    {money(0, receipt.currency)}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Text className="mt-8 text-sm text-foreground-muted">
              Thank you for your business — we appreciate it. Your account is
              paid in full and no further action is needed.
            </Text>

            <Text className="mt-3 text-sm text-foreground-muted">
              A PDF copy of this receipt is attached, along with your account
              statement — download and keep them for your records.
            </Text>

            <Hr className="my-6 border-border" />

            <Text className="my-0 text-xs text-foreground-muted">
              {VENDOR.name} · {VENDOR.address}
            </Text>
            <Text className="my-0 text-xs text-foreground-muted">
              {VENDOR.tax}
            </Text>
            <Text className="mt-2 mb-0 text-xs text-foreground-muted">
              Questions?{" "}
              <Link
                href={`mailto:${VENDOR.billing}`}
                className="text-foreground underline"
              >
                {VENDOR.billing}
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/** Plain-text alternative. Every HTML email needs one. */
export function paymentReceiptText(receipt: PaymentReceipt): string {
  const total = receipt.invoices.reduce((sum, i) => sum + i.amount, 0);
  const pad = (s: string, n: number) => s.padEnd(n);

  const lines = [
    `RECEIPT ${receipt.receiptNo}`,
    "",
    `Amount${receipt.paymentId ? ` (${receipt.paymentId})` : ""}: ` +
      `${money(total, receipt.currency)}`,
    `Paid ${receipt.paidOn} · ${receipt.method}` +
      `${receipt.methodDetail ? ` · ${receipt.methodDetail}` : ""}`,
  ];

  lines.push(
    "",
    `Received from: ${receipt.billTo.company}`,
    ...(receipt.billTo.attn ? [`Attn: ${receipt.billTo.attn}`] : []),
    "",
    "INVOICES SETTLED",
    "-".repeat(60),
  );

  for (const inv of receipt.invoices) {
    lines.push(
      `${pad(inv.ref, 18)}${pad(settlementLabel(inv), 14)}` +
        `${money(inv.amount, receipt.currency).padStart(14)}`,
    );
  }

  lines.push(
    "-".repeat(60),
    `${pad("BALANCE", 18)}${money(0, receipt.currency).padStart(14)}`,
    "",
    "Thank you for your business — we appreciate it.",
    "Your account is paid in full and no further action is needed.",
    "",
    "A PDF copy of this receipt is attached, along with your account",
    "statement — download and keep them for your records.",
    "",
    `${VENDOR.name} · ${VENDOR.address}`,
    VENDOR.tax,
    `Questions? ${VENDOR.billing}`,
  );

  return lines.join("\n");
}
