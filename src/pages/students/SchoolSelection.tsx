import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LogoutButton from "@/components/ui/LogoutButton";
import { School, GraduationCap, Calculator, BookOpen, CheckCircle2, Briefcase, Activity, Target } from "lucide-react";
import { getAllSchools } from "@/utils/api";
import studentImage from '@/assets/student-login-image.png';

// Content Mapping based on School 
const SCHOOL_CONTENT: Record<string, any> = {
    "SOP": {
        title: "School of Programming",
        icon: <CodeIcon className="w-6 h-6" />,
        description: "Ever dreamed of building the next big app? Unlock your potential to code for digital world. Learn front-end & back-end development to turn your creativity into real-life projects",
        whatYouWillLearn: [
            "Front-end development: Web and Mobile development in Javascript, React.js, and Android",
            "Back-end development: Python, Node.js, Javascript",
            "Soft skills: English speaking, teamwork, emotional intelligence, and leadership skills",
            "Hands-on projects: Clone projects for products such as WhatsApp and Facebook"
        ],
        coCurricular: "Apart from core subject learning student get to participate in voting for student council, running student councils, maintaining health & hygiene, cooking, sports, recreational & field visits",
        careerPaths: "Students will get 100% assistance for securing job in roles such as entry-level Software Developer, Front-End Developer, Back-End Developer, Python Developer, Javascript Developer, Testing & QA engineer",
        image: studentImage // Placeholder image
    },
    "SOB": {
        title: "School of Business",
        icon: <BriefcaseIcon className="w-6 h-6" />,
        description: "Ever pictured yourself as a business person? With skills in Google Suite, CRM, Digital Marketing, and Data Analytics, we prepare you for a digital-first economy",
        whatYouWillLearn: [
            "Introduction to Google Suite: Learning advanced Google Sheets, slides, and forms",
            "Introduction: Customer Relationship Management & Salesforce",
            "Digital Marketing: Website building, Social media marketing & SEO",
            "Data Analytics: Statistics, SQL queries, Tableau"
        ],
        coCurricular: "Apart from core subject learning student get to participate in voting for student council, running student councils, maintaining health & hygiene, cooking, sports, recreational & field visits",
        careerPaths: "Students will get 100% assistance for securing jobs in roles such as Customer Relationship Representative, CRM Associate, Salesforce Associate & Operations Associate",
        image: studentImage // Placeholder image
    },
    "SOF": {
        title: "School of Finance",
        icon: <Calculator className="w-6 h-6" />,
        description: "Fascinated by the financial world? Master the arts of Accounting, Taxation, and Tally to unlock new opportunities in the finance sector",
        whatYouWillLearn: [
            "Financial Accounting: Learning accounting, cost accounting, management accounting",
            "Learning Taxation: Learning Direct Tax, computation of income of individual, firm & company",
            "Learning Tally: User interface and company management, ledgers, payment voucher & financial reports"
        ],
        coCurricular: "Apart from core subject learning student get to participate in voting for student council, running student councils, maintaining health & hygiene, cooking, sports, recreational & field visits",
        careerPaths: "Students will get 100% assistance for securing jobs in finance roles such as accountants and analysts",
        image: studentImage // Placeholder image
    },
    "BCA": {
        title: "BCA Program",
        icon: <GraduationCap className="w-6 h-6" />,
        description: "A comprehensive degree program designed to build a strong foundation in computer applications and software development.",
        whatYouWillLearn: [
            "Core Programming: C, C++, Java, and Python",
            "Database Management: SQL, NoSQL, and Database Design",
            "Web Technologies: HTML, CSS, JavaScript, and PHP",
            "System Analysis: Software engineering principles and project management"
        ],
        coCurricular: "Participate in hackathons, coding competitions, technical seminars, and industry visits to enhance practical knowledge.",
        careerPaths: "Graduates can pursue careers as Software Developer, System Analyst, Database Administrator, and Web Developer.",
        image: studentImage // Placeholder image 
    }
};

const SchoolSelection = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
    const [preferredSchoolId, setPreferredSchoolId] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const data = await getAllSchools();
                setSchools(data || []);
                // Default select first school if available
                if (data && data.length > 0) {
                    // normalizing name to UPPERCASE for matching
                    const firstSchoolName = data[0].school_name?.toUpperCase() || "";
                    // Try to find a match in our content map keys
                    const match = Object.keys(SCHOOL_CONTENT).find(key => firstSchoolName.includes(key));
                    if (match) setSelectedSchool(match);
                    else if (data[0].school_name) setSelectedSchool(data[0].school_name); // Fallback
                }
            } catch (error) {
                console.error("Failed to fetch schools", error);
                toast({
                    title: "Error",
                    description: "Failed to load schools. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSchools();
    }, [toast]);

    const handleConfirm = () => {
        if (!preferredSchoolId) {
            toast({
                title: "Select a School",
                description: "Please choose your preferred school from the dropdown to proceed.",
                variant: "destructive",
                className: "border-red-500 bg-red-50 text-red-900"
            });
            return;
        }
        // Store selected school name and id
        const chosenSchool = schools.find(s => String(s.id) === preferredSchoolId);
        localStorage.setItem("school_id", preferredSchoolId);
        navigate("/students/details/registration", {
            state: { school_id: preferredSchoolId }
        });
    };

    const currentContent = selectedSchool ? (SCHOOL_CONTENT[selectedSchool] || SCHOOL_CONTENT[Object.keys(SCHOOL_CONTENT).find(k => selectedSchool.includes(k)) || ""]) : null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center student-bg-gradient">
                <div className="text-xl font-semibold text-gray-700">Loading Schools...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen student-bg-gradient flex flex-col items-center justify-start p-6 pt-12">
            <LogoutButton />

            <div className="w-full max-w-7xl">
                <h1 className="text-4xl font-bold text-center text-gray-900 mb-8 drop-shadow-sm">Choose Your Schools</h1>

                {/* Tabs / School Selection */}
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                    {schools.map((school) => {
                        // Basic normalization to match keys
                        const schoolKey = school.school_name?.toUpperCase();
                        // Find matching content key
                        const contentKey = Object.keys(SCHOOL_CONTENT).find(key => schoolKey?.includes(key)) || school.school_name;
                        const isSelected = selectedSchool && (selectedSchool === school.school_name || selectedSchool === contentKey);

                        // Get content for label if available, else use API name
                        const label = SCHOOL_CONTENT[contentKey]?.title || school.school_name;

                        return (
                            <button
                                key={school.id}
                                onClick={() => setSelectedSchool(contentKey || school.school_name)}
                                className={`
                    px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-sm
                    ${isSelected
                                        ? 'bg-primary text-white shadow-md transform scale-105 ring-2 ring-offset-2 ring-primary'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-primary'
                                    }
                 `}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                {currentContent ? (
                    <Card className="w-full bg-white/95 backdrop-blur shadow-2xl border-none overflow-hidden animate-in fade-in zoom-in duration-300">
                        <CardContent className="p-0">
                            <div className="flex flex-col lg:flex-row">
                                {/* Left Side - Image */}
                                <div className="lg:w-2/5 relative h-64 lg:h-auto min-h-[400px]">
                                    <div className="absolute inset-0 bg-gray-900/10 z-10"></div>
                                    <img
                                        src={currentContent.image || studentImage}
                                        alt={currentContent.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
                                        <div className="flex items-center gap-3 text-white">
                                            <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                                                {currentContent.icon}
                                            </div>
                                            <h2 className="text-2xl font-bold">{currentContent.title}</h2>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side - Details */}
                                <div className="lg:w-3/5 p-8 lg:p-10 flex flex-col">
                                    <div className="mb-8">
                                        <h3 className="text-3xl font-bold text-gray-800 mb-4">{currentContent.title}</h3>
                                        <p className="text-gray-600 text-lg leading-relaxed">
                                            {currentContent.description}
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                                                    <BookOpen className="w-5 h-5 text-primary" />
                                                    What You'll Learn
                                                </h4>
                                                <ul className="space-y-3">
                                                    {currentContent.whatYouWillLearn?.map((item: string, idx: number) => (
                                                        <li key={idx} className="flex items-start gap-2 text-gray-600 text-sm">
                                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                                                            <span>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                                                <Target className="w-5 h-5 text-primary" />
                                                Career Paths
                                            </h4>
                                            <p className="text-gray-600 text-sm leading-relaxed p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                {currentContent.careerPaths}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Prefer your school dropdown */}
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Prefer your school *
                                        </label>
                                        <select
                                            value={preferredSchoolId}
                                            onChange={(e) => setPreferredSchoolId(e.target.value)}
                                            className="w-full p-3 border-2 border-primary/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white text-gray-700 mb-4 appearance-none"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23E31F6D' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                                        >
                                            <option value="">-- Select your preferred school --</option>
                                            {schools.map((school) => (
                                                <option key={school.id} value={String(school.id)}>
                                                    {school.school_name}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="flex justify-end">
                                            <Button
                                                className={`px-8 py-6 text-lg rounded-xl shadow-lg transition-all w-full md:w-auto transform ${preferredSchoolId
                                                    ? 'bg-primary hover:bg-primary/90 text-white hover:shadow-xl hover:scale-105'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                                onClick={handleConfirm}
                                                disabled={!preferredSchoolId}
                                            >
                                                Continue
                                                <span className="ml-2">→</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center py-20 bg-white/50 backdrop-blur rounded-2xl">
                        <p className="text-xl text-gray-500">Select a school to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

function CodeIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    )
}

function BriefcaseIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}

export default SchoolSelection;
