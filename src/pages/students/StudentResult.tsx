import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const storedData = JSON.parse(localStorage.getItem("studentFormData") || "{}");

// Mock API data
const mockData = {
  id: 1,
  name: storedData.name || "John Doe",
  email: storedData.email || "john.doe@example.com",
  screeningScore: 31,
  qualifiedSchool: "School of Programming",
  tests: [
    {
      id: 1,
      name: "Online Screening Test",
      score: 31,
      status: "Pass",
      completionDate: "2025-09-10T10:00:00",
      slotBooking: {
        status: "Completed",
        scheduledTime: null,
        canReschedule: false,
      },
    },
    {
      id: 2,
      name: "English Test",
      score: 25,
      status: "Pending",
      slotBooking: {
        status: "Pending",
        scheduledTime: null,
        canReschedule: true,
      },
    },
    {
      id: 3,
      name: "Culture Fit Test",
      score: 28,
      status: "Pending",
      slotBooking: {
        status: "Pending",
        scheduledTime: null,
        canReschedule: true,
      },
    },
  ],
};

export default function StudentResult() {
  const [tests, setTests] = useState(mockData.tests);

  const handleBooking = (testId: number) => {
    setTests((prev) =>
      prev.map((t) =>
        t.id === testId
          ? {
              ...t,
              slotBooking: {
                status: "Booked",
                scheduledTime: "2025-09-15T10:00:00", // mock scheduled time
                canReschedule: true,
              },
            }
          : t
      )
    );
  };

  const handleCancelBooking = (testId: number) => {
    setTests((prev) =>
      prev.map((t) =>
        t.id === testId
          ? {
              ...t,
              slotBooking: {
                status: "Cancelled",
                scheduledTime: null,
                canReschedule: true,
              },
            }
          : t
      )
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🎓 Student Status</h1>
        <p className="text-gray-600">
          Your details, tests, results, and slot booking status.
        </p>
      </header>

      {/* Student Details Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Name:</strong> {mockData.name}</p>
          <p><strong>Email:</strong> {mockData.email}</p>
          <p><strong>Screening Score:</strong> {mockData.screeningScore}</p>
          <p><strong>Qualified School:</strong> {mockData.qualifiedSchool}</p>
        </CardContent>
      </Card>

      {/* Test Results & Slot Booking */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results & Slot Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Test</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Slot Status</th>
                  <th className="px-4 py-2 border">Scheduled Time</th>
                  <th className="px-4 py-2 border">Actions</th>
                  <th className="px-4 py-2 border">Marks</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td className="px-4 py-2 border">{test.name}</td>
                    <td className="px-4 py-2 border">{test.status}</td>
                    <td className="px-4 py-2 border">{test.slotBooking.status}</td>
                    <td className="px-4 py-2 border">
                      {test.slotBooking.scheduledTime
                        ? new Date(test.slotBooking.scheduledTime).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2 border space-x-2">
                      {test.slotBooking.status === "Pending" && test.slotBooking.canReschedule && (
                        <Button onClick={() => handleBooking(test.id)}>Book Slot</Button>
                      )}
                      {test.slotBooking.status === "Booked" && test.slotBooking.canReschedule && (
                        <>
                          <Button variant="outline" onClick={() => handleCancelBooking(test.id)}>
                            Cancel
                          </Button>
                          <Button onClick={() => handleBooking(test.id)}>Reschedule</Button>
                        </>
                      )}
                      {test.slotBooking.status === "Completed" && (
                        <Button variant="outline" disabled>
                          Completed
                        </Button>
                      )}
                      {test.slotBooking.status === "Cancelled" && test.slotBooking.canReschedule && (
                        <Button onClick={() => handleBooking(test.id)}>Request New Slot</Button>
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
  );
}
