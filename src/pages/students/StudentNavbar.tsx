import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom"; // use if routing

export default function StudentNavbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/students" },
    { name: "Results", path: "/students/result" },
    { name: "Slot Booking", path: "/students/slots-booking" },
    { name: "Offer Letter", path: "/students/offer-letter" },
    // { name: "Profile", path: "/profile" },
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Title */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">🎓 Student Portal</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-700 hover:text-blue-600 transition font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <button
              onClick={() => setOpen(!open)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Links */}
      {open && (
        <div className="md:hidden bg-gray-50 px-4 py-3 space-y-2 shadow-inner">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block text-gray-700 hover:text-blue-600 transition font-medium"
              onClick={() => setOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
