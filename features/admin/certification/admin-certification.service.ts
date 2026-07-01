import type { AuthUser } from "@/features/auth/permission.service";
import { PermissionService } from "@/features/auth/permission.service";
import { creators } from "@/lib/data";
import { listCertificationFormsForAdmin } from "@/lib/studioos/certification-form-service";

export type AdminCertificationFormRow = {
  id: string;
  formId: string;
  creatorId: string;
  creatorName: string;
  status: string;
  notificationId: string | null;
  issuedAt: string;
  submittedAt: string | null;
  fieldCount: number;
};

export class AdminCertificationService {
  async list(user: AuthUser): Promise<AdminCertificationFormRow[]> {
    PermissionService.assert(user, "admin.campaign.manage");
    const forms = await listCertificationFormsForAdmin();

    return forms.map((form) => {
      const creator = creators.find((item) => item.id === form.creator_id);
      return {
        id: form.id,
        formId: form.form_id,
        creatorId: form.creator_id,
        creatorName: creator?.name ?? form.creator_id,
        status: form.status,
        notificationId: form.notification_id,
        issuedAt: form.issued_at,
        submittedAt: form.submitted_at,
        fieldCount: form.fields.length
      };
    });
  }
}

export const adminCertificationService = new AdminCertificationService();
