import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "@react-email/components";

import { PaymentReceiptEmail, paymentReceiptText } from "../src/templates/payment-receipt.tsx";
import { acmeRctAcme20260803 as receipt } from "../src/data/acme-rct-acme-20260803.ts";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
await mkdir(outDir, { recursive: true });

const html = await render(PaymentReceiptEmail(receipt), { pretty: true });
const text = paymentReceiptText(receipt);

const base = receipt.receiptNo.toLowerCase();
await writeFile(join(outDir, `${base}.html`), html, "utf8");
await writeFile(join(outDir, `${base}.txt`), text, "utf8");

console.log(`html  ${html.length} bytes -> out/${base}.html`);
console.log(`text  ${text.length} bytes -> out/${base}.txt`);
