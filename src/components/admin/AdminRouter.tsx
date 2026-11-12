"use client";

import { Link } from "@/i18n/navigation";
import { AdminDashboard, AnalyticsPage } from "./AdminDashboard";
import { AccountPage, AuditPage, CouponsPage, CustomerDetailPage, CustomersPage, ReviewsPage, SettingsPage, StaffPage } from "./ManagePages";
import { DeliveriesPage, OrderDetailPage, OrdersPage, PrintOrderPage } from "./OrdersPages";
import { ProductFormPage, ProductsPage } from "./ProductsPages";
import { Notice, btn, useCan, useRoles } from "./ui";

/**
 * One catch-all route (/admin/…) hands the rest of the address to this component, which picks the page.
 * It keeps the admin as a single, easy-to-read table instead of a dozen near-empty route files.
 */
export function AdminRouter({ slug }: Readonly<{ slug: string[] }>) {
  const [section, a, b] = slug;
  const { roles } = useRoles();
  const owner = useCan("Admin");
  const readers = useCan("Admin", "Manager", "Viewer");
  const deliveryOnly = roles.includes("Delivery") && !readers;

  const denied = <Notice title="Not available for your role" body="Ask the shop owner if you need access to this page."><Link href="/admin/orders" className={`${btn} mt-6`}>Go to orders</Link></Notice>;
  const readOnly = (page: React.ReactNode) => (readers ? page : denied);

  switch (section) {
    case undefined: return deliveryOnly ? <DeliveriesPage /> : <AdminDashboard />;
    case "orders": return a ? (b === "print" ? <PrintOrderPage id={a} /> : <OrderDetailPage id={a} />) : <OrdersPage />;
    case "deliveries": return <DeliveriesPage />;
    case "products": return readOnly(a === "new" ? <ProductFormPage /> : a ? <ProductFormPage id={Number(a)} /> : <ProductsPage />);
    case "customers": return readOnly(a ? <CustomerDetailPage id={a} /> : <CustomersPage />);
    case "coupons": return readOnly(<CouponsPage />);
    case "reviews": return readOnly(<ReviewsPage />);
    case "analytics": return readOnly(<AnalyticsPage />);
    case "settings": return readOnly(<SettingsPage />);
    case "staff": return owner ? <StaffPage /> : denied;
    case "audit": return owner ? <AuditPage /> : denied;
    case "account": return <AccountPage />;
    default: return <Notice title="Page not found"><Link href="/admin" className={`${btn} mt-6`}>Back to the dashboard</Link></Notice>;
  }
}
