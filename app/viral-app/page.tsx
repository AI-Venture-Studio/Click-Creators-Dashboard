import Breadcrumb from "@/components/Breadcrumb";

export default function ViralAppPage() {
  return (
    <main className="max-w-4xl mx-auto px-10 py-10">
      <Breadcrumb
        crumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Viral App" },
        ]}
      />
      <p className="text-xs text-gray-400">Viral App</p>
    </main>
  );
}
