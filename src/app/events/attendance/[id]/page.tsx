import AttendanceReport from "@/components/AttendanceReport";

type AttendancePageParams = {
  params: { id: string };
};

export default async function AttendancePage({ params }: AttendancePageParams) {
  const { id } = await params;

  return <AttendanceReport eventId={id} />;
}
