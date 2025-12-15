import {
  ADMISSIONS_EMAIL,
  ADMISSIONS_PHONE_DISPLAY,
  ADMISSIONS_PHONE_TEL,
} from "@/lib/const";
import { Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-100 border-t rounded-b-xl py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-700">
          
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Email:</span>
            <a
              href={`mailto:${ADMISSIONS_EMAIL}`}
              className="text-blue-600 hover:underline"
            >
              {ADMISSIONS_EMAIL}
            </a>
          </div>

          <span className="hidden sm:inline text-gray-400">|</span>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Helpline:</span>
            <a
              href={`tel:${ADMISSIONS_PHONE_TEL}`}
              className="text-blue-600 hover:underline"
            >
              {ADMISSIONS_PHONE_DISPLAY}
            </a>
          </div>

        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          For any issues related to results or slot booking, contact admissions support.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
