import AdminFeedClient from "@/components/admin/feed/AdminFeedClient";

// Page is a server component
export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen overflow-y-auto">
      <AdminFeedClient />
    </div>
  );
}
