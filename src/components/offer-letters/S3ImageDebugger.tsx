import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Debug Component: Test S3 Image URLs
 * Usage: Add to any page temporarily to test image fetching
 * 
 * Example:
 * <S3ImageDebugger defaultImageId="1" defaultCampus="Main Campus" />
 */
export const S3ImageDebugger = ({
  defaultImageId = "",
  defaultCampus = "",
}: {
  defaultImageId?: string;
  defaultCampus?: string;
}) => {
  const { toast } = useToast();
  const [imageId, setImageId] = useState(defaultImageId);
  const [campusName, setCampusName] = useState(defaultCampus);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState("");

  const getAuthToken = () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Not authenticated. Please login first.");
      return null;
    }
    return token;
  };

  const getApiBase = () => {
    return (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  };

  const testGetById = async () => {
    const token = getAuthToken();
    if (!token || !imageId) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/offer-letter-template-images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Error: ${res.status}`);
      }

      setResponse(data);
      toast({ title: "✅ Success", description: "Image fetched by ID" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch";
      setError(msg);
      toast({ title: "❌ Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const testGetByCampus = async () => {
    const token = getAuthToken();
    if (!token || !campusName) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const apiBase = getApiBase();
      const res = await fetch(
        `${apiBase}/api/offer-letter-template-images?campus_name=${encodeURIComponent(campusName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Error: ${res.status}`);
      }

      setResponse(data);
      toast({
        title: "✅ Success",
        description: `Found ${data.data?.length || 0} images for ${campusName}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch";
      setError(msg);
      toast({ title: "❌ Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "✅ Copied", description: "URL copied to clipboard" });
  };

  const validateS3Url = (url: string) => {
    const s3Pattern = /^https:\/\/[a-z0-9-]+\.s3(\.[a-z0-9-]+)?\.amazonaws\.com\/.+$/i;
    return s3Pattern.test(url);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">🔍 S3 Image Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Test by ID */}
          <div className="space-y-2 border-b pb-3">
            <Label htmlFor="image-id" className="text-xs font-semibold">
              Get Image by ID
            </Label>
            <div className="flex gap-1">
              <Input
                id="image-id"
                type="number"
                placeholder="Image ID (e.g., 1)"
                value={imageId}
                onChange={(e) => setImageId(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={testGetById}
                disabled={!imageId || loading}
                className="text-xs"
              >
                {loading ? "Loading..." : "Fetch"}
              </Button>
            </div>
          </div>

          {/* Test by Campus */}
          <div className="space-y-2 border-b pb-3">
            <Label htmlFor="campus-name" className="text-xs font-semibold">
              Get Images by Campus
            </Label>
            <div className="flex gap-1">
              <Input
                id="campus-name"
                type="text"
                placeholder="Campus name"
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                className="text-xs"
              />
              <Button
                size="sm"
                onClick={testGetByCampus}
                disabled={!campusName || loading}
                className="text-xs"
              >
                {loading ? "Loading..." : "Fetch"}
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-semibold">Response:</div>

              {/* Single Image */}
              {response.data && !Array.isArray(response.data) && (
                <div className="bg-muted p-2 rounded text-xs space-y-1">
                  <div>
                    <span className="font-mono text-xs">ID:</span> {response.data.id}
                  </div>
                  <div>
                    <span className="font-mono text-xs">Campus:</span> {response.data.campus_name}
                  </div>
                  <div>
                    <span className="font-mono text-xs">Name:</span> {response.data.image_name}
                  </div>
                  <div>
                    <span className="font-mono text-xs">Type:</span> {response.data.image_type}
                  </div>
                  <div className="bg-background p-1 rounded break-all">
                    <div className="font-semibold text-[10px] mb-1">S3 URL:</div>
                    <div className="text-[10px] font-mono">
                      {response.data.s3_url}
                    </div>
                    {validateS3Url(response.data.s3_url) ? (
                      <div className="text-[10px] text-green-600 font-semibold mt-1">
                        ✅ Valid S3 URL format
                      </div>
                    ) : (
                      <div className="text-[10px] text-red-600 font-semibold mt-1">
                        ❌ Invalid S3 URL format
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-1 text-xs h-6"
                      onClick={() => copyToClipboard(response.data.s3_url)}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-1 text-xs h-6"
                      onClick={() => window.open(response.data.s3_url, "_blank")}
                    >
                      🔗 Open in Browser
                    </Button>
                  </div>
                  {response.data.s3_key && (
                    <div className="text-[10px]">
                      <span className="font-mono">Key:</span> {response.data.s3_key}
                    </div>
                  )}
                </div>
              )}

              {/* Multiple Images */}
              {Array.isArray(response.data) && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold">Found {response.data.length} images:</div>
                  {response.data.map((img: any, idx: number) => (
                    <div key={idx} className="bg-muted p-2 rounded text-xs">
                      <div className="font-semibold">{img.image_name || img.image_type}</div>
                      <div className="break-all font-mono text-[10px] my-1">
                        {img.s3_url}
                      </div>
                      {validateS3Url(img.s3_url) ? (
                        <div className="text-[10px] text-green-600">✅ Valid</div>
                      ) : (
                        <div className="text-[10px] text-red-600">❌ Invalid</div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-1 text-xs h-6"
                        onClick={() => copyToClipboard(img.s3_url)}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-2 rounded text-xs text-blue-900 space-y-1">
            <div className="font-semibold">How to test:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter Image ID (from upload response) or Campus name</li>
              <li>Click Fetch to get data from API</li>
              <li>Check if s3_url format is valid</li>
              <li>Click "Open in Browser" to verify image loads</li>
              <li>Copy URL and test in new tab if needed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
