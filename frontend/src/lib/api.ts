// Client for POST /api/plan with zod validation and typed response.
import { z } from "zod";

export const InstallmentSchema = z.object({
  provider: z.string(),
  installment_no: z.number(),
  due_date: z.string(),
  amount: z.number(),
  currency: z.string(),
  autopay: z.boolean(),
  late_fee: z.number()
});
export type Installment = z.infer<typeof InstallmentSchema>;

export const RequestSchema = z.object({
  items: z.array(InstallmentSchema).min(1),
  paycheckDates: z.array(z.string()).optional(),
  payCadence: z.enum(["weekly", "biweekly", "semimonthly", "monthly"]).optional(),
  nextPayday: z.string().optional(),
  minBuffer: z.number().default(100),
  timeZone: z.string().default("UTC")
});

export const ResponseSchema = z.object({
  summary: z.string(),
  actionsThisWeek: z.array(z.string()),
  riskFlags: z.array(z.string()),
  ics: z.string(), // base64
  normalized: z.array(z.object({
    provider: z.string(),
    dueDate: z.string(),
    amount: z.number(),
    autopay: z.boolean().optional(),
    lateFee: z.number().optional()
  }))
});

export type PlanRequest = z.infer<typeof RequestSchema>;
export type PlanResponse = z.infer<typeof ResponseSchema>;

export async function buildPlan(body: PlanRequest): Promise<PlanResponse> {
  const payload = RequestSchema.parse(body);
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const ctype = res.headers.get("content-type") || "";

    // RFC 9457: application/problem+json
    if (ctype.includes("application/problem+json")) {
      const p = await res.json().catch(() => ({}));
      const msg = [p.title, p.detail].filter(Boolean).join(" — ") || `API error ${res.status}`;
      const e: any = new Error(msg);
      e.problem = p;
      throw e;
    }

    // Fallback for non-problem+json errors
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || err?.error || `API error ${res.status}`);
  }

  const json = await res.json();
  return ResponseSchema.parse(json);
}