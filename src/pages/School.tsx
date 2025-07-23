import React, { useEffect, useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const School = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("https://dev-join.navgurukul.org/api/school")
      .then(res => res.json())
      .then(data => {
        setSchools(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter schools based on search query
  const filteredSchools = schools.filter(school =>
    school.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="ml-64 overflow-auto h-screen flex flex-col items-center">
        <div className="p-4 w-full">
          <div className="bg-card rounded-xl shadow-soft border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Schools</h2>
                  <p className="text-muted-foreground text-sm mt-1">Manage and view all schools</p>
                </div>
              </div>
              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    placeholder="Search by school name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 border rounded w-full"
                  />
                </div>
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">S.No</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">School Name</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading schools...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSchools.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <Search className="w-8 h-8 opacity-50" />
                          <span>No schools found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSchools.map((school, idx) => (
                      <tr
                        key={school.id}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/school/${school.id}`)}
                      >
                        <td className="py-4 px-6">{idx + 1}</td>
                        <td className="py-4 px-6 text-orange-600 font-medium">{school.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Show total count */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSchools.length} of {schools.length} schools
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default School; 