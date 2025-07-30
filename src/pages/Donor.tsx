import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Handshake, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const students = [
  {
    id: 1,
    name: "Rukhsar khan",
    number: "9960511321",
    altNumber: "",
    email: "rukh­sarkhan20@navgurukul.org",
    gender: "Female",
    joinedDate: "25 Jul 2021",
    stage: "offerLetterSent",
    jobKab: "N/A",
    daysPassed: "N/A",
    kitneAurDin: "",
    kitneDinLaenge: "",
    qualification: "Class 10th",
    partnerName: "Akanksha Foundation",
    campus: ""
  },
  {
    id: 2,
    name: "Akash Deshmukh",
    number: "9623738495",
    altNumber: "",
    email: "Update Email",
    gender: "Male",
    joinedDate: "12 Sep 2022",
    stage: "offerLetterSent",
    jobKab: "N/A",
    daysPassed: "N/A",
    kitneAurDin: "",
    kitneDinLaenge: "",
    qualification: "Graduate",
    partnerName: "jojopulli@gmail",
    campus: ""
  },
  {
    id: 3,
    name: "Ankur Singhalvbb",
    number: "8755531363",
    altNumber: "8755531363",
    email: "jayshri20@navgurukul.org",
    gender: "",
    joinedDate: "",
    stage: "offerLetterSent",
    jobKab: "N/A",
    daysPassed: "N/A",
    kitneAurDin: "",
    kitneDinLaenge: "",
    qualification: "Graduate",
    partnerName: "katha",
    campus: ""
  },
  {
    id: 4,
    name: "Dipesh Rangwani",
    number: "7385419562",
    altNumber: "7385419562",
    email: "Update Email",
    gender: "Male",
    joinedDate: "12 Sep 2022",
    stage: "offerLetterSent",
    jobKab: "N/A",
    daysPassed: "N/A",
    kitneAurDin: "",
    kitneDinLaenge: "",
    qualification: "Class 12th",
    partnerName: "United way of Hyderabad",
    campus: ""
  }
];

const donors = [
  { id: 1, name: "Accenture C1" },
  { id: 2, name: "Accenture C2" },
  { id: 3, name: "Accenture C3" },
  { id: 4, name: "Microsoft C1" },
  { id: 5, name: "KPMG C1" },
  { id: 6, name: "LTI" },
  { id: 7, name: "DxC ( EIT)" },
  { id: 8, name: "ACL" },
  { id: 9, name: "Macquarie" }
];

// Sample options for dropdowns
const stageOptions = [
  { value: "offerLetterSent", label: "Offer Letter Sent" },
  { value: "joined", label: "Joined" },
  { value: "pending", label: "Pending" },
];
const campusOptions = [
  { value: "", label: "Select..." },
  { value: "Bangalore", label: "Bangalore" },
  { value: "Pune", label: "Pune" },
  { value: "Delhi", label: "Delhi" },
];

const genderOptions = [
  { value: '', label: 'Select...' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

// Calculate unique partners from students array
const uniquePartners = Array.from(new Set(students.map(s => s.partnerName).filter(Boolean)));

const Donor = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDonor, setSelectedDonor] = useState("Accenture C1 Donor");
  const [donorDialogOpen, setDonorDialogOpen] = useState(false);
  // For dropdowns, you might want to manage state per row in a real app

  // Filter students by name, email, or partner name
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {/* Dashboard-style summary section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Donors</p>
              <p className="text-2xl font-bold text-foreground">{donors.length}</p>
            </div>
            <div className="w-12 h-12 bg-status-prospect/10 rounded-lg flex items-center justify-center">
              <Handshake className="w-6 h-6 text-status-prospect" />
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Unique Partners</p>
              <p className="text-2xl font-bold text-foreground">{uniquePartners.length}</p>
            </div>
            <div className="w-12 h-12 bg-status-active/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-status-active" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center mb-6">{selectedDonor}</h1>
        {/* Search Bar with icon and filter button */}
        <div className="flex items-center justify-between mb-6 gap-2">
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, email, or partner..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Button variant="outline" size="sm" className="h-10 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
         <Dialog open={donorDialogOpen} onOpenChange={setDonorDialogOpen}>
           <DialogTrigger asChild>
             <Button variant="outline" className="px-6 py-2 rounded font-semibold">Donor List</Button>
           </DialogTrigger>
           <DialogContent>
             <DialogTitle>Donors Name</DialogTitle>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="w-16">S.No</TableHead>
                   <TableHead>Name</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {donors.map((donor, idx) => (
                   <TableRow key={donor.id}>
                     <TableCell>{idx + 1}</TableCell>
                     <TableCell>
                       <button
                         className="text-red-600 font-medium hover:underline focus:outline-none"
                         onClick={() => {
                           setSelectedDonor(donor.name);
                           setDonorDialogOpen(false);
                         }}
                       >
                         {donor.name}
                       </button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
             <div className="text-xs text-muted-foreground mt-2 text-right">Rows per page: 10 &nbsp; 1-{donors.length} of {donors.length}</div>
           </DialogContent>
         </Dialog>
        </div>
        {/* Student Data Table - dashboard style */}
        <div className="bg-card rounded-xl shadow-soft border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Alternative Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Joined Date</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Job Kab Lagegi..</TableHead>
                <TableHead>Days Passed</TableHead>
                <TableHead>kitne Aur Din</TableHead>
                <TableHead>kitne Din Laenge</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Partner Name</TableHead>
                <TableHead>Campus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((s, idx) => (
                <TableRow key={s.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <TableCell className="p-4">{s.name}</TableCell>
                  <TableCell className="p-4">{s.number}</TableCell>
                  <TableCell className="p-4">{s.altNumber}</TableCell>
                  <TableCell className="p-4">{s.email}</TableCell>
                  <TableCell className="p-4">
                    <select className="border rounded px-2 py-1 text-sm w-full">
                      {genderOptions.map(opt => (
                        <option key={opt.value} value={opt.value} selected={s.gender === opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="p-4">{s.joinedDate}</TableCell>
                  <TableCell className="p-4">
                    <select className="border rounded px-2 py-1 text-sm w-full">
                      {stageOptions.map(opt => (
                        <option key={opt.value} value={opt.value} selected={s.stage === opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="p-4">{s.jobKab}</TableCell>
                  <TableCell className="p-4">{s.daysPassed}</TableCell>
                  <TableCell className="p-4">{s.kitneAurDin}</TableCell>
                  <TableCell className="p-4">{s.kitneDinLaenge}</TableCell>
                  <TableCell className="p-4">{s.qualification}</TableCell>
                  <TableCell className="p-4">{s.partnerName}</TableCell>
                  <TableCell className="p-4">
                    <select className="border rounded px-2 py-1 text-sm w-full">
                      {campusOptions.map(opt => (
                        <option key={opt.value} value={opt.value} selected={s.campus === opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="text-xs text-muted-foreground mt-2 text-right p-4">Rows per page: 10 &nbsp; 1-{filteredStudents.length} of {filteredStudents.length}</div>
        </div>
      </main>
    </div>
  );
};

export default Donor; 