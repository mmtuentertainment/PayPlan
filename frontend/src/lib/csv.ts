// CSV helpers: parse (string|File), enforce headers, 2k-line cap, Zod validate.
import Papa from "papaparse";
import { z } from "zod";

export const RowSchema = z.object({
  provider: z.string().min(1),
  installment_no: z.coerce.number().int().min(1),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  autopay: z.coerce.boolean(),
  late_fee: z.coerce.number().min(0)
});
export type CsvRow = z.infer<typeof RowSchema>;

export async function parseCsvString(input: string): Promise<CsvRow[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];
  const res = Papa.parse(trimmed, { header: true, skipEmptyLines: true });
  if (res.errors?.length) throw new Error(res.errors[0].message);
  const rows = (res.data as any[]).slice(0, 2000);
  return rows.map((r, i) => {
    try {
      return RowSchema.parse(r);
    } catch (e: any) {
      throw new Error(`Row ${i + 1}: ${e.message}`);
    }
  });
}

export async function parseCsvFile(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors?.length) return reject(new Error(res.errors[0].message));
        try {
          const rows = (res.data as any[]).slice(0, 2000).map((r, i) => {
            try {
              return RowSchema.parse(r);
            } catch (e: any) {
              throw new Error(`Row ${i + 1}: ${e.message}`);
            }
          });
          resolve(rows);
        } catch (e) {
          reject(e);
        }
      },
      error: reject
    });
  });
}