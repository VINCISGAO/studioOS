/**
 * Minimal TypeScript API client — generated from OpenAPI contract.
 * Regenerate: npm run openapi:generate
 */
export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: string; message: string } };
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export const StudioOsApiPaths = {
  health: "/api/v1/health",
  authMe: "/api/v1/auth/me",
  campaigns: "/api/v1/campaigns",
  campaign: (id: string) => `/api/v1/campaigns/${id}`,
  campaignReview: (id: string) => `/api/v1/campaigns/${id}/review`,
  campaignCheckout: (id: string) => `/api/v1/campaigns/${id}/checkout`,
  campaignEscrow: (id: string) => `/api/v1/campaigns/${id}/escrow`,
  version: (id: string) => `/api/v1/versions/${id}`,
  wallet: "/api/v1/wallet",
  creatorPortal: "/api/v1/me/creator/portal",
  brandPortal: "/api/v1/me/brand/portal",
  brandProjectDetail: (projectId: string) => `/api/v1/portal/brand/projects/${projectId}`,
  brandProjectCollaboration: (projectId: string) =>
    `/api/v1/portal/brand/projects/${projectId}/collaboration`,
  creatorProjectDetail: (orderId: string) => `/api/v1/portal/creator/projects/${orderId}`,
  creatorProjectCollaboration: (orderId: string) =>
    `/api/v1/portal/creator/projects/${orderId}/collaboration`,
  notifications: "/api/v1/notifications",
  membership: "/api/v1/me/membership",
  adminOverview: "/api/v1/admin/overview",
  adminPayments: "/api/v1/admin/payments",
  adminPayout: (campaignId: string) => `/api/v1/admin/payments/${campaignId}/payout`,
  openApiSpec: "/api/v1/openapi"
} as const;

export type StudioOsClientOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
};

export class StudioOsApiClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: StudioOsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.fetchFn = options.fetch ?? fetch;
  }

  private url(path: string) {
    return `${this.baseUrl}${path}`;
  }

  async getHealth() {
    return this.get<{ service: string; checks: Record<string, string>; timestamp: string }>(
      StudioOsApiPaths.health
    );
  }

  async getAuthMe() {
    return this.get<{ id: string; email: string; role: string }>(StudioOsApiPaths.authMe);
  }

  async listCampaigns(page = 1, limit = 20) {
    return this.get<{ items: unknown[]; pagination: Record<string, number> }>(
      `${StudioOsApiPaths.campaigns}?page=${page}&limit=${limit}`
    );
  }

  async listAdminPayments(limit = 100, offset = 0) {
    return this.get<{ items: unknown[]; total: number }>(
      `${StudioOsApiPaths.adminPayments}?limit=${limit}&offset=${offset}`
    );
  }

  async markCreatorPayoutPaid(campaignId: string) {
    return this.post<{ alreadyPaid: boolean; record: unknown }>(
      StudioOsApiPaths.adminPayout(campaignId)
    );
  }

  async getBrandProjectDetail(projectId: string, tab?: string) {
    const query = tab ? `?tab=${encodeURIComponent(tab)}` : "";
    return this.get<import("@/features/portal/portal.types").BrandProjectPortalDetailResponse>(
      `${StudioOsApiPaths.brandProjectDetail(projectId)}${query}`
    );
  }

  async getCreatorProjectDetail(orderId: string) {
    return this.get<import("@/features/portal/portal.types").CreatorProjectPortalDetailResponse>(
      StudioOsApiPaths.creatorProjectDetail(orderId)
    );
  }

  async listNotifications() {
    return this.get<{ items: unknown[]; unreadCount: number }>(StudioOsApiPaths.notifications);
  }

  async get<T>(path: string): Promise<ApiResult<T>> {
    const res = await this.fetchFn(this.url(path), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    return res.json() as Promise<ApiResult<T>>;
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    const res = await this.fetchFn(this.url(path), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json() as Promise<ApiResult<T>>;
  }
}

export const studioOsApi = new StudioOsApiClient();
