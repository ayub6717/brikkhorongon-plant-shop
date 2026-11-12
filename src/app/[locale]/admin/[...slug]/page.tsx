import { AdminRouter } from "@/components/admin/AdminRouter";

type Props = Readonly<{ params: Promise<{ slug: string[] }> }>;

export default async function AdminPage({ params }: Props) {
  const { slug } = await params;
  return <AdminRouter slug={slug} />;
}
