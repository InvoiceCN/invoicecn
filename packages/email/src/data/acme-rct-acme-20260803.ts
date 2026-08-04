import type { PaymentReceipt } from "@/templates/payment-receipt";

/**
 * Payment received 2026-08-03 by Interac e-Transfer, settling the three
 * invoices on statement ST-ACME-2026-07.
 *
 * ACME-20260503 is deliberately absent: prepared but never billed.
 */
export const acmeRctAcme20260803: PaymentReceipt = {
  receiptNo: "RCT-ACME-20260803",
  paidOn: "August 3, 2026",
  currency: "CAD",
  method: "Interac e-Transfer",
  methodDetail: "pay@example.com",
  paymentId: "PMT-ACME-20260803",
  statementNo: "ST-ACME-2026-07",
  billTo: {
    company: "Acme Corporation",
    attn: "Alex Doe",
    email: "finance@acme.example",
  },
  invoices: [
    {
      ref: "ACME-20260531",
      amount: 6139.67,
    },
    {
      ref: "ACME-20260628",
      amount: 6424.8,
    },
    {
      ref: "ACME-20260725",
      amount: 12250.82,
    },
  ],
};
