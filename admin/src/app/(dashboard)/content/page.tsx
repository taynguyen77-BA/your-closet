import { AdminCollectionPage } from "@/components/shared/admin-collection-page";

export default function ContentPage() {
  return (
    <AdminCollectionPage
      config={{
        collection: "cms_content",
        title: "CMS Nội dung",
        description: "Banners, onboarding, FAQ, legal pages, and featured mobile content",
        manage: "content.manage",
        statuses: ["draft", "published", "archived"],
        allowCreate: true,
        allowDelete: true,
        fields: [
          { key: "key", label: "Key" },
          { key: "type", label: "Type" },
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          { key: "locale", label: "Locale" },
          { key: "updatedAt", label: "Updated" },
        ],
      }}
    />
  );
}
