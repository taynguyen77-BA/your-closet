import { AdminCollectionPage } from "@/components/shared/admin-collection-page";

export default function Page() {
  return (
    <div className="space-y-8">
      <AdminCollectionPage
        config={{
          collection: "affiliate_products",
          title: "Affiliate products",
          description: "Partner catalog, commission rules, deeplinks, and product status",
          manage: "affiliate.manage",
          statuses: ["active", "inactive"],
          allowCreate: true,
          allowDelete: true,
          fields: [
            { key: "name", label: "Product" },
            { key: "partnerName", label: "Partner" },
            { key: "category", label: "Category" },
            { key: "colors", label: "Colors" },
            { key: "styleTags", label: "Style tags" },
            { key: "price", label: "Price" },
            { key: "commissionRate", label: "Commission" },
            { key: "deeplink", label: "Deeplink" },
            { key: "trackingCode", label: "Tracking" },
            { key: "clicks", label: "Clicks" },
            { key: "conversions", label: "Conversions" },
            { key: "revenueVnd", label: "Revenue" },
            { key: "status", label: "Status" },
          ],
        }}
      />
      <AdminCollectionPage
        config={{
          collection: "shopping_events",
          title: "Clicks & conversions",
          description: "AI Stylist impressions, affiliate clicks, community item clicks, and conversion source",
          fields: [
            { key: "eventType", label: "Event" },
            { key: "targetType", label: "Target type" },
            { key: "targetId", label: "Target" },
            { key: "source", label: "Source" },
            { key: "recommendationId", label: "Recommendation" },
            { key: "outfitId", label: "Outfit" },
            { key: "createdAt", label: "Created" },
          ],
        }}
      />
    </div>
  );
}
