import { useState, useEffect } from 'react';
import { Case, CaseFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';

export const useCases = (userKey: string) => {
  const [cases, setCases] = useState<Case[]>([]);

  // Load cases from localStorage on mount
  useEffect(() => {
    const savedCases = localStorage.getItem(`legalCases_${userKey}`);
    if (savedCases) {
      setCases(JSON.parse(savedCases));
    }
  }, [userKey]);

  // Save cases to localStorage whenever cases change
  useEffect(() => {
    localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(cases));
  }, [cases, userKey]);

  const addCase = (caseData: CaseFormData) => {
    const newCase: Case = {
      id: Date.now().toString(),
      ...caseData,
      stage: 'Điều tra',
      defendants: caseData.defendants.map(defendant => ({
        ...defendant,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })),
      createdAt: getCurrentDate()
    };
    setCases(prev => [...prev, newCase]);
  };

  const updateCase = (updatedCase: Case) => {
    setCases(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
  };

  const deleteCase = (caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
  };

  const transferStage = (caseId: string, newStage: Case['stage']) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const updated = { ...c, stage: newStage };
        
        // Auto-update transfer dates
        if (newStage === 'Truy tố' && !c.prosecutionTransferDate) {
          updated.prosecutionTransferDate = getCurrentDate();
        } else if (newStage === 'Xét xử' && !c.trialTransferDate) {
          updated.trialTransferDate = getCurrentDate();
        }
        
        return updated;
      }
      return c;
    }));
  };

  const getCasesByStage = (stage: Case['stage']) => {
    return cases.filter(c => c.stage === stage);
  };

  const getExpiringSoonCases = () => {
    return cases.filter(c => {
      // CHỈ ÁP DỤNG CHO VỤ ÁN Ở GIAI ĐOẠN ĐIỀU TRA
      if (c.stage !== 'Điều tra') {
        return false;
      }

      // Check investigation deadline for cases in investigation stage
      const today = new Date();
      const deadline = new Date(c.investigationDeadline.split('/').reverse().join('-'));
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Cảnh báo nếu thời hạn điều tra còn <= 15 ngày
      if (diffDays <= 15) return true;
      
      // Check detention deadlines for defendants in investigation stage
      const detainedDefendants = c.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
      return detainedDefendants.some(d => {
        const detentionDeadline = new Date(d.detentionDeadline!.split('/').reverse().join('-'));
        const detentionDiffTime = detentionDeadline.getTime() - today.getTime();
        const detentionDiffDays = Math.ceil(detentionDiffTime / (1000 * 60 * 60 * 24));
        return detentionDiffDays <= 15;
      });
    });
  };

  return {
    cases,
    addCase,
    updateCase,
    deleteCase,
    transferStage,
    getCasesByStage,
    getExpiringSoonCases
  };
};