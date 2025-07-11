import { useState, useEffect } from 'react';
import { Case, CaseFormData } from '../types';
import { getCurrentDate } from '../utils/dateUtils';
import { dbManager } from '../utils/indexedDB';

export const useCases = (userKey: string, isDBInitialized: boolean) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cases from IndexedDB on mount
  useEffect(() => {
    if (!isDBInitialized) return;

    const loadCases = async () => {
      try {
        const savedCases = await dbManager.loadData<Case>('cases');
        setCases(savedCases);
      } catch (error) {
        console.error('Failed to load cases:', error);
        // Fallback to localStorage
        const fallbackCases = localStorage.getItem(`legalCases_${userKey}`);
        if (fallbackCases) {
          setCases(JSON.parse(fallbackCases));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCases();
  }, [userKey, isDBInitialized]);

  // Save cases to IndexedDB whenever cases change
  useEffect(() => {
    if (!isDBInitialized || isLoading || cases.length < 0) return;

    const saveCases = async () => {
      try {
        await dbManager.saveData('cases', cases);
        // Also save to localStorage as backup
        localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(cases));
      } catch (error) {
        console.error('Failed to save cases:', error);
        // Fallback to localStorage
        localStorage.setItem(`legalCases_${userKey}`, JSON.stringify(cases));
      }
    };

    saveCases();
  }, [cases, userKey, isLoading, isDBInitialized]);

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
      if (c.stage !== 'Điều tra') {
        return false;
      }

      const today = new Date();
      const deadline = new Date(c.investigationDeadline.split('/').reverse().join('-'));
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 15) return true;
      
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
    getExpiringSoonCases,
    isLoading
  };
};