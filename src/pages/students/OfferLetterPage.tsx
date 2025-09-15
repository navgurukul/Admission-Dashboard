// OfferLetterPage.jsx
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OfferLetterPage() {
  const [offerLetter, setOfferLetter] = useState(null);
  const [previousLetters, setPreviousLetters] = useState([]);

  // Mock fetch
  useEffect(() => {
    const mockPreviousLetters = [
      { id: 1, name: "Offer_Letter_July.pdf", url: "/mock/offer_july.pdf" },
      { id: 2, name: "Offer_Letter_Aug.pdf", url: "/mock/offer_aug.pdf" },
    ];
    setPreviousLetters(mockPreviousLetters);
    setOfferLetter(mockPreviousLetters[mockPreviousLetters.length - 1]);
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newLetter = {
      id: Date.now(),
      name: file.name,
      url: URL.createObjectURL(file),
    };

    setPreviousLetters([...previousLetters, newLetter]);
    setOfferLetter(newLetter);
  };

  const handleDownload = () => {
    if (!offerLetter) return;
    const link = document.createElement("a");
    link.href = offerLetter.url;
    link.download = offerLetter.name;
    link.click();
  };

 return (
  <div className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📄 Offer Letters</h1>

      {/* Current Offer Letter */}
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle>Latest Offer Letter</CardTitle>
        </CardHeader>
        <CardContent>
          {offerLetter ? (
            <iframe
              src={offerLetter.url}
              className="w-full h-96 rounded-lg border"
              title="Offer Letter Preview"
            ></iframe>
          ) : (
            <p className="text-gray-500">No offer letter available</p>
          )}
          <div className="mt-4 flex gap-3">
            <Button onClick={handleDownload} disabled={!offerLetter}>
              Download Current Letter
            </Button>
            <label className="cursor-pointer bg-blue-50 px-4 py-2 rounded-lg border hover:bg-blue-100">
              Upload New Letter
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Previous Letters */}
      <Card className="shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle>Previous Offer Letters</CardTitle>
        </CardHeader>
        <CardContent>
          {previousLetters.length > 0 ? (
            <table className="w-full border-collapse border text-left text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">#</th>
                  <th className="border px-4 py-2">File Name</th>
                  <th className="border px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {previousLetters.map((letter, index) => (
                  <tr key={letter.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{index + 1}</td>
                    <td className="border px-4 py-2">{letter.name}</td>
                    <td className="border px-4 py-2">
                      <a
                        href={letter.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No previous letters available</p>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);

}
