import { useState, useEffect } from 'react';
import { Report, ReportFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';

export const useReports = (userKey: string) => {
  const [reports, setReports] = useState<Report[]>([]);

  // Load reports from localStorage on mount
  useEffect(() => {
    const savedReports = localStorage.getItem(`legalReports_${userKey}`);
    if (savedReports) {
      setReports(JSON.parse(savedReports));
    }
  }, [userKey]);

  // Save reports to localStorage whenever reports change
  useEffect(() => {
    localStorage.setItem(`legalReports_${userKey}`, JSON.stringify(reports));
  }, [reports, userKey]);

  const addReport = (reportData: ReportFormData) => {
    const newReport: Report = {
      id: Date.now().toString(),
      ...reportData,
      stage: 'Đang xử lý',
      createdAt: getCurrentDate()
    };
    setReports(prev => [...prev, newReport]);
  };

  const updateReport = (updatedReport: Report) => {
    setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
  };

  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const transferReportStage = (reportId: string, newStage: Report['stage']) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        const updated = { ...r, stage: newStage };
        
        // Auto-update dates based on stage
        if (newStage === 'Khởi tố' && !r.prosecutionDate) {
          updated.prosecutionDate = getCurrentDate();
        } else if ((newStage === 'Không khởi tố' || newStage === 'Tạm đình chỉ' || newStage === 'Chuyển đi') && !r.resolutionDate) {
          updated.resolutionDate = getCurrentDate();
        }
        
        return updated;
      }
      return r;
    }));
  };

  const getReportsByStage = (stage: Report['stage']) => {
    return reports.filter(r => r.stage === stage);
  };

  const getExpiringSoonReports = () => {
    return reports.filter(r => {
      if (r.stage !== 'Đang xử lý') return false;
      
      const today = new Date();
      const reportDate = new Date(r.reportDate.split('/').reverse().join('-'));
      const diffTime = today.getTime() - reportDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Cảnh báo nếu tin báo đã tiếp nhận >= 30 ngày mà chưa xử lý
      return diffDays >= 30;
    });
  };

  return {
    reports,
    addReport,
    updateReport,
    deleteReport,
    transferReportStage,
    getReportsByStage,
    getExpiringSoonReports
  };
};