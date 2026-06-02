"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CMS_SECTIONS = [
  { title: "Home banners", count: 4, href: "#" },
  { title: "Onboarding slides", count: 5, href: "#" },
  { title: "FAQ", count: 12, href: "#" },
  { title: "Legal pages", count: 3, href: "#" },
  { title: "Seasonal collections", count: 2, href: "#" },
];

export default function ContentPage() {
  return (
    <div>
      <PageHeader
        title="CMS Nội dung"
        description="Banners, campaigns, legal, featured content"
        actions={<Button>Tạo nội dung</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CMS_SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {s.count} items
              </span>
              <Button variant="outline" size="sm">
                Quản lý
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
