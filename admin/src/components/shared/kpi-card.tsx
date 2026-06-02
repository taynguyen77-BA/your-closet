import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: LucideIcon;
  className?: string;
}

export function KpiCard({
  label,
  value,
  change,
  changePositive,
  icon: Icon,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <p
                className={cn(
                  "text-xs font-medium",
                  changePositive ? "text-success" : "text-destructive"
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-fashion-gradient p-2.5 dark:bg-fashion-dark">
            <Icon className="h-5 w-5 text-foreground/80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
