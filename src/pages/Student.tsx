// import React, { useState } from "react";
// import StudentRoutes from "@/routes/StudentRoutes";
// import { useLanguage } from "@/context/LanguageContext";

// // Create a StudentContext for form + image
// export const StudentContext = React.createContext(null);

// const Student: React.FC = () => {
//   const { language, setLanguage } = useLanguage();

//   const [formData, setFormData] = useState({
//     profileImage: null,
//     firstName: "",
//     middleName: "",
//     lastName: "",
//     dateOfBirth: "",
//     whatsappNumber: "",
//     alternateNumber: "",
//     email: "",
//     gender: "",
//     state: "",
//     district: "",
//     city: "",
//     pinCode: "",
//     currentStatus: "",
//     maximumQualification: "",
//     schoolMedium: "",
//     casteTribe: "",
//     religion: ""
//   });

//   const [imagePreview, setImagePreview] = useState<string | null>(null);

//   // Input handlers
//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setFormData(prev => ({ ...prev, profileImage: file }));
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result as string);
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = () => {
//     console.log("Form Submitted:", formData);
//   };

//   const isFormValid = () => {
//     return (
//       formData.firstName &&
//       formData.lastName &&
//       formData.dateOfBirth &&
//       formData.whatsappNumber &&
//       formData.email &&
//       formData.gender &&
//       formData.state &&
//       formData.district &&
//       formData.city &&
//       formData.pinCode &&
//       formData.currentStatus &&
//       formData.maximumQualification &&
//       formData.schoolMedium &&
//       formData.casteTribe &&
//       formData.religion
//     );
//   };

//   return (
//     <StudentContext.Provider
//       value={{
//         formData,
//         setFormData,
//         handleInputChange,
//         handleImageChange,
//         imagePreview,
//         isFormValid,
//         handleSubmit,
//         language,
//         setLanguage,
//       }}
//     >
//       <div className="min-h-screen">
//         <StudentRoutes />
//       </div>
//     </StudentContext.Provider>
//   );
// };

// export default Student;
