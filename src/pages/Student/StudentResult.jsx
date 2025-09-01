import React from "react";

const StudentResult = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* Heading */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Student Status</h1>

      {/* Status Message */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-4 mb-6">
        <p className="text-gray-700 font-medium">
          <span className="font-semibold">Shilpi Gupta</span> Your Screening Test
          Pass is still pending. You’re not required to give the online test now.
          We will soon complete your admission process.
        </p>
      </div>

      {/* Table */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="py-3 px-4">Re-Test</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Book Slot</th>
              <th className="py-3 px-4">Marks</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="py-3 px-4">
                <button
                  disabled
                  className="bg-gray-300 text-gray-600 px-4 py-2 rounded-md cursor-not-allowed"
                >
                  RE-TEST
                </button>
              </td>
              <td className="py-3 px-4 text-gray-700">Screening Test Pass</td>
              <td className="py-3 px-4">
                <button className="bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-600">
                  BOOK SLOT
                </button>
              </td>
              <td className="py-3 px-4 text-gray-800 font-semibold">31</td>
            </tr>
          </tbody>
        </table>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-600">
          <span>Rows per page: 20</span>
          <span>1-1 of 1</span>
          <div className="flex gap-2">
            <button className="px-2 py-1 rounded bg-gray-200">{"<"}</button>
            <button className="px-2 py-1 rounded bg-gray-200">{">"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResult;
