import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTests } from "../../utils/TestContext";
import LogoutButton from "@/components/ui/LogoutButton";

interface Student {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  whatsappNumber: string;
  city: string;
}

export default function StudentResult() {
  const [student, setStudent] = useState<Student | null>(null);
  const { tests } = useTests();
  const navigate = useNavigate();

  // Load student from localStorage on mount
  useEffect(() => {
    const savedStudent = localStorage.getItem("studentFormData");
    if (savedStudent) {
      setStudent(JSON.parse(savedStudent));
    }
  }, []);

  const handleBooking = (testId: number) => {
    navigate(`/students/slot-booking/${testId}`);
  };

  const handleRetestNavigation = () => {
    localStorage.setItem("testStarted", "false");
    localStorage.setItem("testCompleted", "false");
    localStorage.setItem("allowRetest", "true");

    navigate("/students/test/start", { replace: true });
  };

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading student data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 p-4 flex">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full h-[95vh] overflow-y-auto">
        <header className="mb-6">
          <LogoutButton className="from-orange-400 to-red-500" />
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
            <p>
              <span className="font-semibold">Name:</span> {student.firstName}{" "}
              {student.middleName} {student.lastName}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {student.email}
            </p>
            <p>
              <span className="font-semibold">Phone Number:</span>{" "}
              {student.whatsappNumber}
            </p>
            <p>
              <span className="font-semibold">City:</span> {student.city}
            </p>
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
                  {tests.map((test) => {
                    // Get slot booking status
                    const slotStatus = test.slotBooking?.status;
                    const isSlotBooked = slotStatus === "Booked";
                    const isSlotCancelled = slotStatus === "Cancelled";
                    const hasSlotBooking = test.slotBooking !== undefined;

                    return (
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
                          {test.slotBooking?.scheduledTime
                            ? new Date(
                                test.slotBooking.scheduledTime
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-4 py-2 border">
                          {/* Retest button for failed screening test */}
                          {test.name === "Screening Test" && test.status === "Fail" && (
                            <Button 
                              onClick={handleRetestNavigation}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              Retest
                            </Button>
                          )}

                          {/* Book/Reschedule button for passed tests */}
                          {test.status === "Pass" && (
                            <>
                              {isSlotBooked || isSlotCancelled ? (
                                <Button 
                                  onClick={() => handleBooking(test.id)}
                                  variant="outline"
                                >
                                  Reschedule
                                </Button>
                              ) : (
                                <Button 
                                  onClick={() => handleBooking(test.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Book Slot
                                </Button>
                              )}
                            </>
                          )}

                          {/* View Result for completed tests */}
                          {test.action === "view-result" && (
                            <span className="text-gray-600">Result Ready</span>
                          )}

                          {/* No action available */}
                          {test.status === "Pending" && test.name !== "Screening Test" && (
                            <span className="text-gray-400 text-sm">Complete previous stage</span>
                          )}
                        </td>
                        <td className="px-4 py-2 border">{test.score || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
