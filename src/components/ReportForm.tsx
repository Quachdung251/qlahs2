import React, { useState } from 'react';
import { Plus, FileText, Shield, User, Calendar } from 'lucide-react';
import { ReportFormData, CaseFormData } from '../types';
import { getCurrentDate, addDaysToDate } from '../utils/dateUtils';
import AutocompleteInput from './AutocompleteInput';
import DateInput from './DateInput';
import { criminalCodeData, formatCriminalCodeDisplay } from '../data/criminalCode';
// import { prosecutorsData } from '../data/prosecutors'; // <-- XÓA DÒNG NÀY HOẶC COMMENT NÓ LẠI

// IMPORT Prosecutor interface từ api/prosecutors
import { Prosecutor } from '../api/prosecutors'; // <-- THÊM DÒNG NÀY

interface ReportFormProps {
  onAddReport: (reportData: ReportFormData) => void;
  onTransferToCase: (caseData: CaseFormData) => void;
  prosecutors: Prosecutor[]; // <-- THÊM PROP NÀY VÀO INTERFACE
}

const ReportForm: React.FC<ReportFormProps> = ({ onAddReport, onTransferToCase, prosecutors }) => { // <-- NHẬN PROP prosecutors
  const [formData, setFormData] = useState<ReportFormData>({
    name: '',
    charges: '',
    resolutionDeadline: addDaysToDate(getCurrentDate(), 30), // Mặc định 30 ngày từ hôm nay
    prosecutor: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddReport(formData);
    setFormData({
      name: '',
      charges: '',
      resolutionDeadline: addDaysToDate(getCurrentDate(), 30),
      prosecutor: '',
      notes: ''
    });
  };

  const handleProsecute = () => {
    // Convert report to case
    const caseData: CaseFormData = {
      name: formData.name,
      charges: formData.charges,
      investigationDeadline: getCurrentDate(), // Set to today as starting point
      prosecutor: formData.prosecutor, // Prosecutor ID from report
      notes: formData.notes,
      defendants: [] // Empty defendants array - will be added later
    };
    
    onTransferToCase(caseData);
    
    // Clear form
    setFormData({
      name: '',
      charges: '',
      resolutionDeadline: addDaysToDate(getCurrentDate(), 30),
      prosecutor: '',
      notes: ''
    });
    
    alert('Tin báo đã được khởi tố và chuyển sang hệ thống quản lý vụ án!');
  };

  // Prepare options for autocomplete
  const criminalCodeOptions = criminalCodeData.map(item => ({
    value: formatCriminalCodeDisplay(item),
    label: formatCriminalCodeDisplay(item),
    description: item.description
  }));

  // ---------- SỬ DỤNG PROP prosecutors THAY VÌ prosecutorsData ----------
  const prosecutorOptions = prosecutors.map(prosecutor => ({
    value: prosecutor.id || '', // <-- Lấy ID của KSV để lưu vào value
    label: prosecutor.Name, // <-- Hiển thị tên KSV (lưu ý 'Name' chữ N hoa từ DB)
    description: `${prosecutor.title}${prosecutor.department ? ` - ${prosecutor.department}` : ''}`
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Plus className="text-blue-600" size={24} />
        Thêm Tin Báo Mới
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Tên Tin Báo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên tin báo"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield size={16} className="inline mr-1" />
              Tội Danh (Điều, Khoản)
            </label>
            <AutocompleteInput
              value={formData.charges}
              onChange={(value) => setFormData({ ...formData, charges: value })}
              options={criminalCodeOptions}
              placeholder="Nhập hoặc tìm kiếm tội danh"
              required
              icon={<Shield size={16} />}
            />
          </div>
          
          <DateInput
            value={formData.resolutionDeadline}
            onChange={(value) => setFormData({ ...formData, resolutionDeadline: value })}
            label="Ngày Hết Hạn Giải Quyết"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Kiểm Sát Viên Phụ Trách
            </label>
            <AutocompleteInput
              value={formData.prosecutor}
              onChange={(value) => setFormData({ ...formData, prosecutor: value })}
              options={prosecutorOptions} // <-- ĐÃ CẬP NHẬT ĐỂ SỬ DỤNG prosecutors từ props
              placeholder="Nhập hoặc chọn kiểm sát viên"
              required
              icon={<User size={16} />}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Ghi Chú
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập ghi chú (tùy chọn)"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleProsecute}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            disabled={!formData.name || !formData.charges || !formData.prosecutor}
          >
            Khởi Tố Ngay
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Thêm Tin Báo
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;