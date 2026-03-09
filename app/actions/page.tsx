import Breadcrumb from "@/components/Breadcrumb";

export default function ActionsPage() {
  return (
    <main className="max-w-4xl mx-auto px-10 py-10">
      <Breadcrumb
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Actions" },
        ]}
      />
      <p className="text-xs text-gray-400">Actions</p>
    </main>
  );
}
