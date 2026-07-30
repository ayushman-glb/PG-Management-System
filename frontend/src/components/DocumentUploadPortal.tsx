import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, FileText, Eye, Trash2, Building, UserCheck, Lock
} from 'lucide-react';
import { useTheme } from '../theme';

export const DocumentUploadPortal: React.FC = () => {
  const [activeRoleTab, setActiveRoleTab] = useState<'resident' | 'owner'>('resident');
  const { darkMode } = useTheme();

  // Resident Uploads
  const [residentDocs, setResidentDocs] = useState([
    { id: '1', name: 'Aadhaar Card (Front & Back)', type: 'AADHAAR', status: 'VERIFIED', fileUrl: '#' },
    { id: '2', name: 'PAN Card', type: 'PAN', status: 'VERIFIED', fileUrl: '#' },
    { id: '3', name: 'Passport / Driving License', type: 'PASSPORT', status: 'PENDING', fileUrl: '#' },
    { id: '4', name: 'Passport Size Photo', type: 'PHOTO', status: 'VERIFIED', fileUrl: '#' },
    { id: '5', name: 'College / Office ID Card', type: 'COLLEGE_ID', status: 'VERIFIED', fileUrl: '#' },
    { id: '6', name: 'Guardian Aadhaar & Contact Proof', type: 'GUARDIAN', status: 'VERIFIED', fileUrl: '#' }
  ]);

  // Owner Uploads
  const [ownerDocs, setOwnerDocs] = useState([
    { id: '101', name: 'Owner PAN Card', type: 'PAN', status: 'VERIFIED', fileUrl: '#' },
    { id: '102', name: 'Owner Aadhaar Card', type: 'AADHAAR', status: 'VERIFIED', fileUrl: '#' },
    { id: '103', name: 'Property Ownership / Lease Deed', type: 'PROPERTY_PAPERS', status: 'VERIFIED', fileUrl: '#' },
    { id: '104', name: 'Trade / Commercial Rental License', type: 'RENTAL_LICENSE', status: 'VERIFIED', fileUrl: '#' },
    { id: '105', name: 'GST Certificate (Optional)', type: 'GST', status: 'VERIFIED', fileUrl: '#' },
    { id: '106', name: 'Cancelled Cheque / Bank Details', type: 'BANK', status: 'VERIFIED', fileUrl: '#' }
  ]);

  const handleUploadMock = (id: string, role: 'resident' | 'owner') => {
    if (role === 'resident') {
      setResidentDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'VERIFIED' } : d));
    } else {
      setOwnerDocs(prev => prev.map(d => d.id === id ? { ...d, status: 'VERIFIED' } : d));
    }
  };

  const currentDocs = activeRoleTab === 'resident' ? residentDocs : ownerDocs;

  const containerBg = darkMode ? "bg-neutral-900/60 border-white/10 text-white" : "bg-[#F8EEE5] border-[#E6D7CA] text-[#3B2A24]";
  const cardBg = darkMode ? "bg-neutral-900 border-white/10 text-white shadow-xl" : "bg-[#FFFDFB] border-[#E6D7CA] text-[#3B2A24] shadow-md";
  const textPrimary = darkMode ? "text-white" : "text-[#3B2A24]";
  const textMuted = darkMode ? "text-neutral-400" : "text-[#6E5A52]";

  return (
    <div className="w-full space-y-6">
      {/* Role Selector Tabs */}
      <div className={`flex justify-between items-center flex-wrap gap-4 p-4 rounded-3xl border backdrop-blur-md ${containerBg}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveRoleTab('resident')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeRoleTab === 'resident'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : `${textMuted} hover:${textPrimary}`
            }`}
          >
            <UserCheck className="w-4 h-4" /> Resident KYC Documents
          </button>

          <button
            onClick={() => setActiveRoleTab('owner')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeRoleTab === 'owner'
                ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                : `${textMuted} hover:${textPrimary}`
            }`}
          >
            <Building className="w-4 h-4" /> Owner Property Documents
          </button>
        </div>

        <div className={`flex items-center gap-2 text-xs font-medium ${textMuted}`}>
          <Lock className="w-4 h-4 text-emerald-500" /> AES-256 Cloudinary Encrypted Storage
        </div>
      </div>

      {/* Document Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentDocs.map(doc => (
          <motion.div
            key={doc.id}
            whileHover={{ y: -3 }}
            className={`p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${cardBg}`}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  doc.status === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {doc.status === 'VERIFIED' ? '✔ VERIFIED' : '⏳ UPLOAD PENDING'}
                </span>
              </div>

              <h4 className={`text-sm font-bold ${textPrimary}`}>{doc.name}</h4>
              <p className={`text-xs ${textMuted}`}>Encrypted Document Token: DOC-{doc.id}</p>
            </div>

            <div className="pt-3 border-t border-amber-500/10 flex items-center justify-between">
              {doc.status === 'VERIFIED' ? (
                <div className="flex gap-2">
                  <button className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                    darkMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#F8EEE5] text-[#3B2A24] hover:bg-[#E6D7CA]"
                  }`}>
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 flex items-center gap-1 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" /> Re-upload
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleUploadMock(doc.id, activeRoleTab)}
                  className="w-full py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload Document
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

