import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpMvpAction } from "@/app/signup-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { hasDatabaseUrl } from "@/lib/core/database/prisma";
import { Sparkles } from "lucide-react";

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const signupEnabled = hasDatabaseUrl() || hasSupabaseConfig();

  if (!signupEnabled) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          StudioOS
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-zinc-500">Review and approve AI commercial production.</p>

        <form action={signUpMvpAction} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company</Label>
            <Input id="company_name" name="company_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select id="role" name="role" className="flex h-10 w-full rounded-md border px-3 text-sm">
              <option value="brand">Brand</option>
              <option value="studio">Studio</option>
            </select>
          </div>
          {params.error ? <p className="text-sm text-red-600">{decodeURIComponent(params.error)}</p> : null}
          <Button type="submit" className="w-full bg-zinc-900">
            Sign up
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
