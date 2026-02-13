import { z } from "zod";

export const BulkTransactionRowSchema = z.object({
    date: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "Geçersiz tarih formatı (GG.AA.YYYY)"),
    amount: z.number().positive("Tutar pozitif olmalı"),
    description: z.string().optional(),
    type: z.enum(["DEPOSIT", "WITHDRAWAL"]),
    site: z.string().min(1, "Site seçilmeli"), // Name or Code
    financier: z.string().min(1, "Finansör seçilmeli"), // Name or Code
});

export const BulkImportRequestSchema = z.object({
    transactions: z.array(BulkTransactionRowSchema),
});

export type BulkTransactionRow = z.infer<typeof BulkTransactionRowSchema>;
export type BulkImportRequest = z.infer<typeof BulkImportRequestSchema>;
