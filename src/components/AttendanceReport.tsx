"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

type Props = {
  eventId: string;
};

export default function AttendancePage({ eventId }: Props) {
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(
          `${baseUrl}/api/events/attendance/${eventId}`
        );
        const data = await response.json();
        setAttendanceData(data);
      } catch (error) {
        console.error("Failed to fetch attendance data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [eventId]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!attendanceData) {
    return (
      <div className="text-center py-8">
        No attendance data found for this event.
      </div>
    );
  }

  const totalRegistrations = attendanceData.registrations.length;
  const totalCheckIns = attendanceData.checkInCount;
  const attendanceRate =
    totalRegistrations > 0 ? (totalCheckIns / totalRegistrations) * 100 : 0;

  const chartData = {
    labels: attendanceData.checkInCountOverTime.map(
      (entry: any) => entry.timeSlot
    ),
    datasets: [
      {
        label: "Check-ins Over Time",
        data: attendanceData.checkInCountOverTime.map(
          (entry: any) => entry.count
        ),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-center mb-8">
        Attendance Analytics for Event {eventId}
      </h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Event Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Total Registrations</div>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
            </div>
            <div className="flex-1 bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Total Check-ins</div>
              <div className="text-2xl font-bold">{totalCheckIns}</div>
            </div>
            <div className="flex-1 bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="text-sm text-gray-500">Attendance Rate</div>
              <div className="text-2xl font-bold">
                {attendanceRate.toFixed(2)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Check-ins Over Time</CardTitle>
        </CardHeader>
        <CardContent className="w-full h-96">
          <Line data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Check-in Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.registrations
                .filter((registration: any) => registration.checkedIn)
                .map((registration: any) => (
                  <TableRow key={registration.id}>
                    <TableCell>{registration.user.name}</TableCell>
                    <TableCell>
                      {new Date(registration.checkInTime).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
