import React, { useState } from 'react';
import { Plus, Minus, User, FileText, Shield, Clock } from 'lucide-react';
import { CaseFormData, Defendant } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import AutocompleteInput from './AutocompleteInput';
import DateInput from './DateInput';
import { criminalCodeData, formatCriminalCodeDisplay } from '../data/criminalCode';
import { prosecutorsData } from '../data/prosecutors';

interface CaseFormProps {
  onAddCase: (caseData: CaseFormData) => void;
}

const CaseForm: React.FC<CaseFormProps> = ({ onAddCase }) => {
  const [formData, setFormData] = useState<CaseFormData>({
    name: '',
    charges: '',
    investigationDeadline: getCurrentDate(),
    prosecutor: '',
    notes: '',
    defendants: [{ name: '', charges: '', preventiveMeasure: 'Tại ngoại' }]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate case name if empty
    let finalCaseData = { ...formData };
    if (!formData.name.trim() && formData.defendants.length > 0 && formData.defendants[0].name.trim()) {
      const firstDefendant = formData.defendants[0];
      const caseName = `${firstDefendant.name} - ${firstDefendant.charges || 'Chưa xác định tội danh'}`;
      finalCaseData.name = caseName;
    }

    // Auto-set case charges from first defendant if empty
    if (!formData.charges.trim() && formData.defendants.length > 0 && formData.defendants[0].charges.trim()) {
      finalCaseData.charges = formData.defendants[0].charges;
    }
    
    onAddCase(finalCaseData);
    setFormData({
      name: '',
      charges: '',
      investigationDeadline: getCurrentDate(),
      prosecutor: '',
      notes: '',
      defendants: [{ name: '', charges: '', preventiveMeasure: 'Tại ngoại' }]
    });
  };

  const addDefendant = () => {
    setFormData({
      ...formData,
      defendants: [...formData.defendants, { name: '', charges: '', preventiveMeasure: 'Tại ngoại' }]
    });
  };

  const removeDefendant = (index: number) => {
    setFormData({
      ...formData,
      defendants: formData.defendants.filter((_, i) => i !== index)
    });
  };

  const updateDefendant = (index: number, field: keyof Omit<Defendant, 'id'>, value: string) => {
    const updatedDefendants = formData.defendants.map((defendant, i) => {
      if (i === index) {
        const updated = { ...defendant, [field]: value };
        if (field === 'preventiveMeasure' && value === 'Tại ngoại') {
          delete updated.detentionDeadline;
        }
        return updated;
      }
      return defendant;
    });
    setFormData({ ...formData, defendants: updatedDefendants });

    // Auto-update case charges when first defendant's charges change
    if (index === 0 && field === 'charges' && !formData.charges.trim()) {
      setFormData(prev => ({ ...prev, charges: value, defendants: updatedDefendants }));
    }
  };

  // Prepare options for autocomplete
  const criminalCodeOptions = criminalCodeData.map(item => ({
    value: formatCriminalCodeDisplay(item),
    label: formatCriminalCodeDisplay(item),
    description: item.description
  }));

  const prosecutorOptions = prosecutorsData.map(prosecutor => ({
    value: prosecutor.name,
    label: prosecutor.name,
    description: `${prosecutor.title}${prosecutor.department ? ` - ${prosecutor.department}` : ''}`
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Plus className="text-blue-600" size={24} />
        Thêm Vụ Án Mới
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Tên Vụ Án <span className="text-gray-500 text-xs">(để trống sẽ tự động tạo từ tên bị can đầu tiên)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên vụ án hoặc để trống để tự động tạo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield size={16} className="inline mr-1" />
              Tội Danh Vụ Án (Điều, Khoản) <span className="text-gray-500 text-xs">(tự động từ bị can số 1)</span>
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
            value={formData.investigationDeadline}
            onChange={(value) => setFormData({ ...formData, investigationDeadline: value })}
            label="Thời Hạn Điều Tra"
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
              options={prosecutorOptions}
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

        {/* Defendants Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Thông Tin Bị Can</h3>
            <button
              type="button"
              onClick={addDefendant}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              Thêm Bị Can
            </button>
          </div>
          
          {formData.defendants.map((defendant, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-gray-700">
                  Bị Can {index + 1} {index === 0 && <span className="text-sm text-blue-600">(tội danh sẽ tự động áp dụng cho vụ án)</span>}
                </h4>
                {formData.defendants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDefendant(index)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    <Minus size={14} />
                    Xóa Bị Can Này
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Bị Can
                  </label>
                  <input
                    type="text"
                    value={defendant.name}
                    onChange={(e) => updateDefendant(index, 'name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tội Danh Bị Can (Điều, Khoản)
                  </label>
                  <AutocompleteInput
                    value={defendant.charges}
                    onChange={(value) => updateDefendant(index, 'charges', value)}
                    options={criminalCodeOptions}
                    placeholder="Nhập hoặc tìm kiếm tội danh"
                    required
                    className="p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biện Pháp Ngăn Chặn
                  </label>
                  <select
                    value={defendant.preventiveMeasure}
                    onChange={(e) => updateDefendant(index, 'preventiveMeasure', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Tại ngoại">Tại ngoại</option>
                    <option value="Tạm giam">Tạm giam</option>
                  </select>
                </div>
                
                {defendant.preventiveMeasure === 'Tạm giam' && (
                  <DateInput
                    value={defendant.detentionDeadline || ''}
                    onChange={(value) => updateDefendant(index, 'detentionDeadline', value)}
                    label="Thời Hạn Tạm Giam"
                    required
                    className="col-span-1"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Thêm Vụ Án
          </button>
        </div>
      </form>
    </div>
  );
};

export default CaseForm;