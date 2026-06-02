"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/utils";

const PAYMENT_METHODS = [
  { id: "vnpay", label: "VNPay", enabled: true },
  { id: "momo", label: "MoMo", enabled: true },
  { id: "zalopay", label: "ZaloPay", enabled: true },
  { id: "stripe", label: "Stripe", enabled: true },
  { id: "apple_pay", label: "Apple Pay", enabled: true },
  { id: "google_pay", label: "Google Pay", enabled: true },
];

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader
        title="Thanh toán & Tài chính"
        description="Transactions, refunds, payment methods, reports"
        actions={<Button>Tạo báo cáo</Button>}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Doanh thu tháng</p>
            <p className="text-2xl font-bold">{formatVnd(425000000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Refunds</p>
            <p className="text-2xl font-bold">{formatVnd(2400000)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Failed</p>
            <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground uppercase">Commission</p>
            <p className="text-2xl font-bold">{formatVnd(42800000)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phương thức thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAYMENT_METHODS.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <span className="font-medium">{m.label}</span>
              <Badge variant={m.enabled ? "success" : "outline"}>
                {m.enabled ? "Enabled" : "Off"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
