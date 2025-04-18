import {
  Table,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Registration } from "@prisma/client";

interface CheckinTableProps {
  registrations: Registration[];
}

export default function CheckinTable({ registrations }: CheckinTableProps) {
  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Check-in Status</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Attendee</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration, index) => (
            <TableRow key={index}>
              <TableCell>{registration.userId}</TableCell>
              <TableCell>
                {registration.checkedIn
                  ? registration.checkInTime.toString()
                  : "N/A"}
              </TableCell>
              <TableCell>
                {registration.checkedIn ? (
                  <Badge variant="default">Checked In</Badge>
                ) : (
                  <Badge variant="secondary">Not Checked In</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
