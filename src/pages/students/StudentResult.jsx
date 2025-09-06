import React from "react";
import { useNavigate } from "react-router-dom";

const StudentResult = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex flex-col items-center p-6">
      {/* Heading */}
      <h1 className="text-4xl font-extrabold text-white drop-shadow mb-6">
        🎓 Student Result
      </h1>

      {/* Status Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 mb-8 border-t-4 border-orange-500">
        <p className="text-gray-700 text-lg leading-relaxed">
          <span className="font-bold text-gray-900">Shilpi Gupta</span>, your{" "}
          <span className="text-orange-600 font-semibold">Screening Test Pass</span>{" "}
          is still pending. You are not required to give the online test now. We
          will soon complete your admission process.
        </p>
      </div>

      {/* Result Table */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gradient-to-r from-orange-500 to-red-500 text-left text-white text-sm uppercase tracking-wide">
            <tr>
              <th className="py-3 px-4">Re-Test</th>
              <th className="py-3 px-4">Stage</th>
              <th className="py-3 px-4">Book Slot</th>
              <th className="py-3 px-4">Marks</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-t hover:bg-gray-50 transition">
              <td className="py-3 px-4">
                <button
                  disabled
                  className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                >
                  RE-TEST
                </button>
              </td>
              <td className="py-3 px-4 font-medium">Screening Test Pass</td>
              <td className="py-3 px-4">
                <button
                  className="bg-gradient-to-r from-orange-600 to-red-500 text-white px-4 py-2 rounded-lg shadow hover:opacity-90 transition"
                  onClick={() => navigate("/students/slot-booking")}
                >
                  BOOK SLOT
                </button>
              </td>
              <td className="py-3 px-4 font-semibold text-gray-900">31</td>
            </tr>
          </tbody>
        </table>

        {/* Footer Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-600 bg-gray-50">
          <span>Rows per page: 20</span>
          <span>1-1 of 1</span>
          <div className="flex gap-2">
            <button className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">
              {"<"}
            </button>
            <button className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300">
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResult;
