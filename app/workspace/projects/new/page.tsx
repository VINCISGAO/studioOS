import Link from "next/link";
import { redirect } from "next/navigation";
import { createMvpProjectAction } from "@/app/mvp-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMvpProfile } from "@/lib/mvp/session";
import { listStudios } from "@/lib/mvp/store";

export default async function NewProjectPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getMvpProfile();
  if (!profile) redirect("/login?role=brand");
  if (profile.role !== "brand") redirect("/workspace/studio");

  const params = await searchParams;
  const studios = await listStudios();

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href="/workspace/brand" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New project</h1>
      <p className="mt-1 text-sm text-zinc-500">Create a review workspace for your ad campaign.</p>

      <form action={createMvpProjectAction} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Summer Launch Hero Film" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand_name">Brand name</Label>
          <Input id="brand_name" name="brand_name" defaultValue={profile.company_name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} placeholder="Campaign goals, deliverables…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigned_studio_id">Assign studio</Label>
          <select
            id="assigned_studio_id"
            name="assigned_studio_id"
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
            defaultValue={studios[0]?.id ?? ""}
          >
            {studios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {params.error === "title" ? (
          <p className="text-sm text-red-600">Title is required.</p>
        ) : null}
        <Button type="submit" className="w-full rounded-md bg-zinc-900">
          Create project
        </Button>
      </form>
    </div>
  );
}
