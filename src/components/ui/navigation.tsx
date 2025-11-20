import {
  LayoutDashboard,
  Calendar,
  LogOut,
  Mail,
  Users,
  MessageSquare,
  Handshake,
  School,
  Shield,
  UserCheck,
  FileQuestion
} from "lucide-react";
import AdminPage from "@/pages/Admin";
// import OwnerPage from "@/pages/Owner";
import Dashboard from "@/pages/Index";
import DonorPage from "@/pages/Donor";
import PartnerPage from "@/pages/Partner";
import CampusPage from "@/pages/Campus";
import SchoolPage from "@/pages/School";
import Interviews from "@/pages/Interviews";
// import OfferLetters from "@/pages/OfferLetters";
import QuestionRepository from "@/pages/QuestionRepository";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  component: React.FC;
  allowedRoles: number[];
}

export const navigation: NavigationItem[] = [
  { name: "Admin", href: "/admin", icon: Shield, component: AdminPage, allowedRoles: [1] },
  { name: "Dashboard", href: "/", icon: LayoutDashboard, component: Dashboard, allowedRoles: [1, 2] },
  { name: "Donor", href: "/donor", icon: Handshake, component: DonorPage, allowedRoles: [1, 2] },
  { name: "Partner", href: "/partners", icon: Users, component: PartnerPage, allowedRoles: [1, 2] },
  { name: "Campus", href: "/campus", icon: School, component: CampusPage, allowedRoles: [1, 2] },
  { name: "School", href: "/school", icon: School, component: SchoolPage, allowedRoles: [1, 2] },
  // { name: "Owner", href: "/owner", icon: UserCheck, component: OwnerPage, allowedRoles: [1] },
  { name: "Interviews", href: "/interviews", icon: MessageSquare, component: Interviews, allowedRoles: [1, 2] },
  // { name: "Offer Letters", href: "/offer-letters", icon: Mail, component: OfferLetters, allowedRoles: [1, 2] },
  { name: "Question Repository", href: "/questions", icon: FileQuestion, component: QuestionRepository, allowedRoles: [1, 2] },
];
