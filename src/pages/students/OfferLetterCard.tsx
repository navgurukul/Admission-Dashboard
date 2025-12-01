import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function OfferLetterCard({ student }) {
  return (
    <Card className="border border-gray-400 bg-white shadow-md p-6 mb-6">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-3xl shadow-sm">
          🎉
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            Congratulations, {student.first_name}!
          </h2>

          <p className="text-sm text-gray-700 mt-1">
            You have successfully completed all online assessments.
          </p>

          <p className="text-sm font-semibold text-green-600 mt-2">
            Your offer letter has been sent to your registered email. Please
            check your inbox for next steps.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default OfferLetterCard;
