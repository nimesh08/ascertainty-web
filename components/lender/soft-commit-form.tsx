"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  lender_name: z.string().min(2),
  lender_email: z.string().email().optional().or(z.literal("")),
  loan_amount_inr: z.coerce.number().positive(),
  interest_rate_bps: z.coerce.number().int().min(0).max(5000).optional(),
  tenure_months: z.coerce.number().int().min(3).max(120).optional(),
  notes: z.string().max(1000).optional(),
});
type Values = z.input<typeof schema>;
type Output = z.output<typeof schema>;

interface SoftCommitFormProps {
  dealId: string;
  recommendedLoanInr: number;
  p5FloorKwh: number;
  recommendedTenureMonths: number;
}

export function SoftCommitForm({
  dealId,
  recommendedLoanInr,
  p5FloorKwh,
  recommendedTenureMonths,
}: SoftCommitFormProps) {
  const router = useRouter();
  const [signing, setSigning] = useState(false);

  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: {
      lender_name: "",
      lender_email: "",
      loan_amount_inr: Math.round(recommendedLoanInr),
      interest_rate_bps: 1400,
      tenure_months: recommendedTenureMonths,
      notes: "",
    },
  });

  async function onSign(values: Output) {
    setSigning(true);
    try {
      const res = await fetch("/api/soft-commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deal_id: dealId,
          p5_floor_kwh: p5FloorKwh,
          ...values,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text);
      }
      toast.success("Soft commitment recorded.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSigning(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSign)} className="space-y-4 print:hidden">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FormField
            control={form.control}
            name="lender_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lender name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Capital Pte. Ltd." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lender_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lender email (optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="ops@acme.example" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <FormField
            control={form.control}
            name="loan_amount_inr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan amount (₹)</FormLabel>
                <FormControl>
                  <Input type="number" step="1000" {...field} value={String(field.value ?? "")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="interest_rate_bps"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest rate (bps)</FormLabel>
                <FormControl>
                  <Input type="number" step="25" {...field} value={String(field.value ?? "")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tenure_months"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenure (months)</FormLabel>
                <FormControl>
                  <Input type="number" step="1" {...field} value={String(field.value ?? "")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Any conditions, disbursement schedule, contact comments…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={signing}>
            {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record soft commitment
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>
      </form>
    </Form>
  );
}
