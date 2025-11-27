// OfferLetterPage.jsx
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/ui/LogoutButton";

export default function OfferLetterPage() {
  const [documents, setDocuments] = useState([]);

  // --- Load mock data once ---
  useEffect(() => {
    const documentsList = [
      { id: 1, name: "Offer_Letter_July.pdf", url: "/mock/offer_july.pdf" },
      { id: 2, name: "Convern_Letter.pdf", url: "/mock/offer_aug.pdf" },
      {
        id: 3,
        name: "Required_Items_List_Which_In_Campus.pdf",
        url: "/mock/offer_aug.pdf",
      },
    ];
    setDocuments(documentsList);
  }, []);

  // --- Download a document by id ---
  const handleDownload = (doc) => {
    const link = document.createElement("a");
    link.href = doc.url;
    link.download = doc.name;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex">
      <LogoutButton />
      <div className="p-6 min-w-full overflow-y-auto">
        <Card className="h-[90vh] rounded-2xl">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <table className="w-full border-collapse text-left text-gray-700">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-4 py-2 w-12">#</th>
                    <th className="border px-4 py-2">File Name</th>
                    <th className="border px-4 py-2 w-32 text-center">
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, index) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{index + 1}</td>
                      <td className="border px-4 py-2">{doc.name}</td>
                      <td className="border px-4 py-2 text-center">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          variant="default"
                        >
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No documents available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
