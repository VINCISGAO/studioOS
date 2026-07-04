import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON
} from "@simplewebauthn/browser";
import { adminMutationHeaders } from "@/lib/studioos/admin-csrf-client";

export async function loginWithAdminPasskey(input: {
  email: string;
  lang: string;
  nextPath: string;
}) {
  const optionsResponse = await fetch("/api/admin/auth/webauthn/login/options", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: input.email })
  });
  const optionsPayload = (await optionsResponse.json()) as {
    ok: boolean;
    options?: PublicKeyCredentialRequestOptionsJSON;
    error?: string;
  };
  if (!optionsPayload.ok || !optionsPayload.options) {
    return { ok: false as const, error: "login_failed" };
  }

  const authResponse = await startAuthentication({ optionsJSON: optionsPayload.options });
  const verifyResponse = await fetch("/api/admin/auth/webauthn/login/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      response: authResponse as AuthenticationResponseJSON,
      lang: input.lang,
      next: input.nextPath
    })
  });

  return (await verifyResponse.json()) as {
    ok: boolean;
    redirectTo?: string;
    error?: string;
  };
}

export async function unlockPasskeyStepUpClient(totpCode: string) {
  const response = await fetch("/api/admin/auth/passkey/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
    body: JSON.stringify({ totpCode })
  });
  return (await response.json()) as { ok: boolean; error?: string };
}

export async function registerAdminPasskey(label?: string) {
  const optionsResponse = await fetch("/api/admin/auth/webauthn/register/options", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminMutationHeaders() }
  });
  const optionsPayload = (await optionsResponse.json()) as {
    ok: boolean;
    options?: PublicKeyCredentialCreationOptionsJSON;
    error?: string;
  };
  if (!optionsPayload.ok || !optionsPayload.options) {
    return { ok: false as const, error: optionsPayload.error ?? "register_failed" };
  }

  const registration = await startRegistration({ optionsJSON: optionsPayload.options });
  const verifyResponse = await fetch("/api/admin/auth/webauthn/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminMutationHeaders() },
    body: JSON.stringify({ response: registration as RegistrationResponseJSON, label })
  });

  return (await verifyResponse.json()) as { ok: boolean; error?: string };
}
