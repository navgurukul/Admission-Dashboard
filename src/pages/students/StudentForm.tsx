import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentForm: React.FC = () => {
  const navigate = useNavigate();

  const selectedLanguage = localStorage.getItem('selectedLanguage') || 'English';

  const [formData, setFormData] = useState({
    profileImage: null,
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    whatsappNumber: "",
    alternateNumber: "",
    email: "",
    gender: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
    currentStatus: "",
    maximumQualification: "",
    schoolMedium: "",
    casteTribe: "",
    religion: ""
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const savedFormData = localStorage.getItem('studentFormData');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    localStorage.setItem('studentFormData', JSON.stringify(newFormData));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFormData = {
        ...formData,
        profileImage: file
      };
      setFormData(newFormData);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = () => {
    return formData.firstName &&
      formData.lastName &&
      formData.dateOfBirth &&
      formData.whatsappNumber &&
      formData.email &&
      formData.gender &&
      formData.state &&
      formData.district &&
      formData.city &&
      formData.pinCode &&
      formData.currentStatus &&
      formData.maximumQualification &&
      formData.schoolMedium &&
      formData.casteTribe &&
      formData.religion;
  };

  const handleSubmit = () => {
    if (isFormValid()) {
      console.log("Form data:", formData);
      localStorage.setItem('studentFormData', JSON.stringify(formData));
      navigate('/students/final-instructions');
    } else {
      alert("Please fill all required fields");
    }
  };

  const handlePrevious = () => {
    navigate('/students/instructions');
  };

  // --- Language Strings (shortened here for brevity, keep your existing Hindi/Marathi/English block) ---
  const content = {
    signUp: "Sign up",
    basicDetails: "Basic Details",
    contactDetails: "Contact Details",
    verification: "Verification",
    alreadyMember: "Already a Member?",
    signIn: "Sign In",
    firstName: "First Name *",
    middleName: "Middle Name",
    lastName: "Last Name *",
    dateOfBirth: "Date of Birth *",
    gender: "Gender *",
    male: "Male",
    female: "Female",
    whatsappNumber: "WhatsApp Number *",
    alternateNumber: "Alternate Number",
    email: "Email Address *",
    contactInfo: "Contact Information",
    addPhoto: "Add Photo",
    saveContinue: "Save & Continue",
    state: "Select State *",
    district: "Select District *",
    city: "City *",
    pinCode: "Pin Code *",
    currentStatus: "Current Status *",
    maximumQualification: "Maximum Qualification *",
    schoolMedium: "School Medium *",
    casteTribe: "Caste/Tribe *",
    religion: "Religion *",
    back: "BACK"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{content.signUp}</h1>
          <div className="absolute top-6 right-6 text-sm text-gray-600">
            {content.alreadyMember} <span className="text-orange-500 cursor-pointer">{content.signIn}</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">{content.basicDetails}</h2>

        {/* Profile + Names */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-4">
            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.firstName} />
            <input type="text" name="middleName" value={formData.middleName} onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.middleName} />
            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.lastName} />
          </div>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 relative cursor-pointer hover:border-orange-400 transition-colors">
              {!imagePreview ? (
                <span className="text-xs text-gray-500">{content.addPhoto}</span>
              ) : (
                <img src={imagePreview} alt="Profile" className="w-full h-full object-cover rounded-xl" />
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" />
          <select name="gender" value={formData.gender} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg">
            <option value="">{content.gender}</option>
            <option value="Male">{content.male}</option>
            <option value="Female">{content.female}</option>
          </select>
        </div>

        {/* Contact Info */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{content.contactInfo}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input type="text" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.whatsappNumber} />
          <input type="text" name="alternateNumber" value={formData.alternateNumber} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.alternateNumber} />
          <input type="email" name="email" value={formData.email} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg md:col-span-2" placeholder={content.email} />
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input type="text" name="state" value={formData.state} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.state} />
          <input type="text" name="district" value={formData.district} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.district} />
          <input type="text" name="city" value={formData.city} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.city} />
          <input type="text" name="pinCode" value={formData.pinCode} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.pinCode} />
        </div>

        {/* Education + Others */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input type="text" name="currentStatus" value={formData.currentStatus} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.currentStatus} />
          <input type="text" name="maximumQualification" value={formData.maximumQualification} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.maximumQualification} />
          <input type="text" name="schoolMedium" value={formData.schoolMedium} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.schoolMedium} />
          <input type="text" name="casteTribe" value={formData.casteTribe} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.casteTribe} />
          <input type="text" name="religion" value={formData.religion} onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg" placeholder={content.religion} />
        </div>

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <button onClick={handlePrevious} className="px-6 py-2 bg-gray-200 rounded-lg">{content.back}</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">{content.saveContinue}</button>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
