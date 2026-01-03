import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllPartners } from "@/utils/api";

const PartnerLanding = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const handlePartnerRedirect = async () => {
            if (!slug) {
                setError("No partner slug provided");
                setLoading(false);
                return;
            }

            try {
                const partners = await getAllPartners();
                // Handle different response structures as seen in Partner.tsx/api.ts
                let partnersArray: any[] = [];
                if (Array.isArray(partners)) {
                    partnersArray = partners;
                } else if (partners && Array.isArray((partners as any).data)) {
                    partnersArray = (partners as any).data;
                } else if (partners && (partners as any).data && Array.isArray((partners as any).data.data)) {
                    partnersArray = (partners as any).data.data;
                }

                const partner = partnersArray.find((p: any) => p.slug === slug);

                if (partner) {
                    localStorage.setItem("partner_id", partner.id);
                    // Optional: Store partner name for UI welcome message if needed
                    localStorage.setItem("partner_name", partner.partner_name);
                    setLoading(false);
                    // navigate("/students"); // Removed auto-redirect
                } else {
                    setError("Partner not found");
                    // Clear any stale partner data
                    localStorage.removeItem("partner_id");
                    localStorage.removeItem("partner_name");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching partners:", err);
                setError("Failed to verify partner link");
                setLoading(false);
            }
        };

        handlePartnerRedirect();
    }, [slug, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
                <div className="text-center bg-card p-8 rounded-lg shadow-md border max-w-md w-full">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-lg font-medium">Verifying partner link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
                <div className="text-center bg-card p-8 rounded-lg shadow-md border max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-2 text-destructive">Link Invalid</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button
                        onClick={() => navigate("/students")}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                        Go to Student Portal
                    </button>
                </div>
            </div>
        );
    }

    const partnerName = localStorage.getItem("partner_name");

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="bg-card w-full max-w-lg p-8 rounded-xl shadow-lg border border-border text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome!</h1>
                    <p className="text-muted-foreground">You have been invited by</p>
                    <div className="text-2xl font-semibold text-primary py-2 bg-primary/10 rounded-lg">
                        {partnerName || "Our Partner"}
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">
                        Please proceed to register and take your admission test.
                    </p>
                    <button
                        onClick={() => navigate("/students")}
                        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all shadow-md active:scale-95"
                    >
                        Start Registration & Test
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartnerLanding;
