import DashboardClient from "@/components/DashboardClient";

type DashboardPageParams = {
  params: { id: string };
};

export default async function DashboardPage({ params }: DashboardPageParams) {
  const { id } = await params;

  return <DashboardClient eventId={id} />;
}
