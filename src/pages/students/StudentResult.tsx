import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStudent } from "../../utils/StudentContext";
import { useTests } from "../../utils/TestContext";

export default function StudentResult() {
  const { student, setStudent } = useStudent();
  const { tests } = useTests();
  const navigate = useNavigate();

  const handleBooking = (testId: number) => {
    navigate(`/students/slot-booking/${testId}`);
  };

  if (!student) return <p>Loading student data…</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 p-4 flex">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full h-[95vh] overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Student Results</h1>
          <p className="text-gray-600">
            Track your test results and interview slot booking status.
          </p>
        </header>

        {/* Student Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Student Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <p><span className="font-semibold">Name:</span> {student.firstName} {student.middleName} {student.lastName}</p>
            <p><span className="font-semibold">Email:</span> {student.email}</p>
            <p><span className="font-semibold">Screening Score:</span> {}</p> /*screeningScore,qualifiedSchool*/
            <p><span className="font-semibold">Qualified School:</span> </p>
          </CardContent>
        </Card>

      {/* Test Results & Slot Booking */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results & Slot Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-left rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 border">Stage</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Scheduled Time</th>
                    <th className="px-4 py-2 border">Actions</th>
                    <th className="px-4 py-2 border">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{test.name}</td>
                      <td className="px-4 py-2 border">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            test.status === "Pass"
                              ? "bg-green-100 text-green-700"
                              : test.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {test.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 border">
                        {test.slotBooking.scheduledTime
                          ? new Date(test.slotBooking.scheduledTime).toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2 border">
                        {(test.slotBooking.status === "Pending" ||
                          test.slotBooking.status === "Booked" ||
                          test.slotBooking.status === "Cancelled") && (
                          <Button onClick={() => handleBooking(test.id)}>
                            {test.slotBooking.status === "Booked"
                              ? "Reschedule"
                              : "Book Slot"}
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-2 border">{test.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
