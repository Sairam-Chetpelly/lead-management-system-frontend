"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Building,
  Globe,
  Home,
  TrendingUp,
  FileText,
} from "lucide-react";
import { authAPI } from "@/lib/auth";
import { useToast } from "@/contexts/ToastContext";
import { validateContactNumber, formatContactNumber } from "@/utils/validation";

interface FormData {
  name: string;
  email: string;
  contactNumber: string;
  comment: string;
  assignmentType: "presales" | "sales" | "";
  leadSourceId: string;
  centreId: string;
  languageId: string;
  projectTypeId: string;
  houseTypeId: string;
  leadValue: string;
}

interface DropdownData {
  centres: Array<{ _id: string; name: string }>;
  languages: Array<{ _id: string; name: string }>;
  leadSources: Array<{ _id: string; name: string }>;
  projectTypes: Array<{ _id: string; name: string }>;
  houseTypes: Array<{ _id: string; name: string }>;
  leadValues: Array<{ value: string; label: string }>;
}

interface LeadCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function LeadCreationForm({
  onSuccess,
  onCancel,
}: LeadCreationFormProps = {}) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    contactNumber: "",
    comment: "",
    assignmentType: "",
    leadSourceId: "",
    centreId: "",
    languageId: "",
    projectTypeId: "",
    houseTypeId: "",
    leadValue: "",
  });

  const [dropdownData, setDropdownData] = useState<DropdownData>({
    centres: [],
    languages: [],
    leadSources: [],
    projectTypes: [],
    houseTypes: [],
    leadValues: [],
  });

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("Dropdown data updated:", dropdownData);
  }, [dropdownData]);

  const fetchDropdownData = async () => {
    try {
      const response = await authAPI.getLeadFormData();
      console.log("Form data response:", response.data);
      setDropdownData(
        response.data || {
          centres: [],
          languages: [],
          leadSources: [],
          projectTypes: [],
          houseTypes: [],
          leadValues: [],
        }
      );
    } catch (error) {
      console.error("Error fetching form data:", error);
      showToast("Failed to load form data", "error");
    } finally {
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate contact number
    const contactValidation = validateContactNumber(formData.contactNumber);
    if (!contactValidation.isValid) {
      showToast(contactValidation.error!, 'error');
      return;
    }
    
    setLoading(true);

    try {
      await authAPI.createLead(formData);
      showToast("Lead created successfully", "success");

      // Reset form
      setFormData({
        name: "",
        email: "",
        contactNumber: "",
        comment: "",
        assignmentType: "",
        leadSourceId: "",
        centreId: "",
        languageId: "",
        projectTypeId: "",
        houseTypeId: "",
        leadValue: "",
      });

      // Call success callback
      onSuccess?.();
    } catch (error: any) {
      showToast(
        error.response?.data?.error || "Failed to create lead",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    if (field === 'contactNumber' && typeof value === 'string') {
      value = formatContactNumber(value);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <User size={16} className="inline mr-2" />
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Mail size={16} className="inline mr-2" />
            Email 
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter email address"
            
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Phone size={16} className="inline mr-2" />
            Contact Number <span className="text-xs text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => handleInputChange("contactNumber", e.target.value)}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber) 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            placeholder="Enter 10-digit contact number"
            maxLength={10}
            pattern="\d{10}"
            required
          />
          {formData.contactNumber && !/^\d{10}$/.test(formData.contactNumber) && (
            <p className="text-red-500 text-xs mt-1">Contact number must be exactly 10 digits</p>
          )}
        </div>

        {/* Assignment Type */}
        {/* Lead Source */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FileText size={16} className="inline mr-2" />
            Lead Source <span className="text-xs text-red-500">*</span>
          </label>
          <select
            value={formData.leadSourceId}
            onChange={(e) => handleInputChange("leadSourceId", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          >
            <option value="">Select Lead Source</option>
            {dropdownData.leadSources.map((source) => (
              <option key={source._id} value={source._id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignment Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Assignment Type <span className="text-xs text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-all">
              <input
                type="radio"
                name="assignmentType"
                value="presales"
                checked={formData.assignmentType === "presales"}
                onChange={(e) =>
                  handleInputChange("assignmentType", e.target.value)
                }
                className="mr-3"
              />
              <span className="font-medium">Presales</span>
            </label>
            <label className="flex items-center p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-all">
              <input
                type="radio"
                name="assignmentType"
                value="sales"
                checked={formData.assignmentType === "sales"}
                onChange={(e) =>
                  handleInputChange("assignmentType", e.target.value)
                }
                className="mr-3"
              />
              <span className="font-medium">Sales</span>
            </label>
          </div>
        </div>
      </div>



      {/* Sales-specific fields */}
      {formData.assignmentType === "sales" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-blue-50 rounded-xl">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Building size={16} className="inline mr-2" />
              Centre <span className="text-xs text-red-500">*</span>
            </label>
            <select
              value={formData.centreId}
              onChange={(e) => handleInputChange("centreId", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required={formData.assignmentType === "sales"}
            >
              <option value="">Select Centre</option>
              {dropdownData.centres.filter(centre => !centre.name.toLowerCase().includes('main')).map(centre => (
                        <option key={centre._id} value={centre._id}>{centre.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Globe size={16} className="inline mr-2" />
              Language <span className="text-xs text-red-500">*</span>
            </label>
            <select
              value={formData.languageId}
              onChange={(e) => handleInputChange("languageId", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required={formData.assignmentType === "sales"}
            >
              <option value="">Select Language</option>
              {dropdownData.languages.map((language) => (
                <option key={language._id} value={language._id}>
                  {language.name}
                </option>
              ))}
            </select>
            
          </div>
          <div className="">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <TrendingUp size={16} className="inline mr-2" />
              Lead Value <span className="text-xs text-red-500">*</span>
            </label>
            <select
              value={formData.leadValue}
              onChange={(e) => handleInputChange("leadValue", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required={formData.assignmentType === "sales"}
            >
              <option value="">Select Lead Value</option>
              {dropdownData.leadValues.map((value) => (
                <option key={value.value} value={value.value}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div hidden>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Building size={16} className="inline mr-2" />
              Project Type
            </label>
            <select
              value={formData.projectTypeId}
              onChange={(e) =>
                handleInputChange("projectTypeId", e.target.value)
              }
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select Project Type</option>
              {dropdownData.projectTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div hidden>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Home size={16} className="inline mr-2" />
              House Type
            </label>
            <select
              value={formData.houseTypeId}
              onChange={(e) => handleInputChange("houseTypeId", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select House Type</option>
              {dropdownData.houseTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          
        </div>
      )}

      {/* Comments */}
      <div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MessageSquare size={16} className="inline mr-2" />
            Comment
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => handleInputChange("comment", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows={4}
            placeholder="Enter any comments"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-gray-100 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
          style={{ backgroundColor: "#0f172a" }}
        >
          {loading ? "Creating Lead..." : "Create Lead"}
        </button>
      </div>
    </form>
  );
}
