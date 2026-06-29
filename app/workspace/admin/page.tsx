import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getMvpProfile } from "@/lib/mvp/session";
import { getAdminStats, listAllProjects } from "@/lib/mvp/store";

export default async function AdminWorkspacePage() {
  const profile = await getMvpProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/workspace");

  const [stats, projects] = await Promise.all([getAdminStats(), listAllProjects()]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-1 text-sm text-zinc-500">Platform overview</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Users", value: stats.users },
          { label: "Projects", value: stats.projects },
          { label: "Videos", value: stats.videos },
          { label: "Comments", value: stats.comments }
        ].map((item) => (
          <Card key={item.label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-2xl font-semibold">{item.value}</p>
              <p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8 shadow-none">
        <CardContent className="p-0">
          <ul className="divide-y">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-medium">{p.title}</span>
                <span className="text-zinc-500 capitalize">{p.status.replace("_", " ")}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
