import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Settings as SettingsIcon, Users, BookOpen, GraduationCap, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNavigation = [
  { name: "User Role", href: "/settings/user-role", icon: UserCheck },
  { name: "Caste", href: "/settings/caste", icon: Users },
  { name: "Religion", href: "/settings/religion", icon: BookOpen },
  { name: "Qualification", href: "/settings/qualification", icon: GraduationCap },
  { name: "Question Repository", href: "/settings/questions", icon: SettingsIcon },
];

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your application settings and configurations</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-1 lg:grid-cols-4">
            {/* Settings Navigation */}
            <div className="lg:col-span-1 border-r border-gray-200">
              <nav className="p-6 space-y-2">
                {settingsNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-3 p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 