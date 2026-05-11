import { PageHeader } from "@/components/layout/page-header";
import { NewProjectForm } from "@/components/admin/new-project-form";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        accent="magenta"
        title="New project"
        description="Registers the MRV project, submits its baseline, and mints the project token — all in one signed transaction."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Projects", href: "/admin/projects" },
          { label: "New" },
        ]}
      />
      <NewProjectForm />
    </div>
  );
}
