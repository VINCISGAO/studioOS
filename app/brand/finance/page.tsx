import { getAppUiLocale } from "@/lib/app-language";
import { CreditCard, FileText, Receipt, Shield, Wallet } from "lucide-react";
import { BrandSectionHub } from "@/components/studioos/brand-section-hub";
import { type SearchParams } from "@/lib/i18n";
import { brandPortalRoutes } from "@/lib/studioos/brand-portal-routes";

export default async function BrandFinancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locale = await getAppUiLocale();

  return (
    <BrandSectionHub
      locale={locale}
      title={locale === "zh" ? "财务中心" : "Finance center"}
      description={
        locale === "zh"
          ? "平台托管、支付记录、发票与支付方式。"
          : "Platform escrow, payment history, invoices, and payment methods."
      }
      sections={[
        {
          href: brandPortalRoutes.financeAccount,
          title: locale === "zh" ? "账户余额" : "Account balance",
          description:
            locale === "zh"
              ? "查看品牌账户余额，充值后可直接支付加购服务费。"
              : "View and top up your brand account balance for add-on fees.",
          icon: Wallet
        },
        {
          href: brandPortalRoutes.financeEscrow,
          title: locale === "zh" ? "平台托管" : "Platform escrow",
          description:
            locale === "zh"
              ? "查看每笔广告的托管状态与释放进度。"
              : "Track escrow status and release progress for each ad.",
          icon: Shield
        },
        {
          href: brandPortalRoutes.financePayments,
          title: locale === "zh" ? "支付记录" : "Payment records",
          description:
            locale === "zh" ? "全部付款、收据与退款记录。" : "All payments, receipts, and refunds.",
          icon: Receipt
        },
        {
          href: brandPortalRoutes.financeInvoices,
          title: locale === "zh" ? "发票" : "Invoices",
          description:
            locale === "zh" ? "下载与管理广告相关发票。" : "Download and manage ad-related invoices.",
          icon: FileText
        },
        {
          href: brandPortalRoutes.financeMethods,
          title: locale === "zh" ? "支付方式" : "Payment methods",
          description:
            locale === "zh" ? "管理公司付款方式与账单信息。" : "Manage company payment methods and billing details.",
          icon: CreditCard
        }
      ]}
    />
  );
}
