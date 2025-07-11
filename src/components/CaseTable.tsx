import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, ArrowRight, CheckCircle, PauseCircle, StopCircle, Send, Download, Edit2, MoreHorizontal, MessageSquare, Clock } from 'lucide-react';
import { Case, Defendant } from '../types';
import { getDaysRemaining, isExpiringSoon } from '../utils/dateUtils';
import CaseEditModal from './CaseEditModal';
import NotesModal from './NotesModal';
import ExtensionModal from './ExtensionModal';

interface CaseTableProps {
  cases: Case[];
  columns: {
    key: keyof Case | 'totalDefendants' | 'shortestDetention' | 'investigationRemaining' | 'shortestDetentionRemaining' | 'notes' | 'actions';
    label: string;
    render?: (caseItem: Case) => React.ReactNode;
  }[];
  onDeleteCase: (caseId: string) => void;
  onTransferStage: (caseId: string, newStage: Case['stage']) => void;
  onUpdateCase: (updatedCase: Case) => void;
  showWarnings?: boolean;
}

const CaseTable: React.FC<CaseTableProps> = ({ 
  cases, 
  columns, 
  onDeleteCase, 
  onTransferStage,
  onUpdateCase,
  showWarnings = false 
}) => {
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [notesCase, setNotesCase] = useState<Case | null>(null);
  const [extensionModal, setExtensionModal] = useState<{
    case: Case;
    type: 'investigation' | 'detention';
    defendant?: Defendant;
  } | null>(null);

  const toggleExpanded = (caseId: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId);
    } else {
      newExpanded.add(caseId);
    }
    setExpandedCases(newExpanded);
  };

  const toggleActions = (caseId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId);
    } else {
      newExpanded.add(caseId);
    }
    setExpandedActions(newExpanded);
  };

  // Export to Excel function with proper CSV formatting
  const exportToExcel = () => {
    if (cases.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    // Create proper CSV headers
    const headers = columns.filter(col => col.key !== 'actions').map(col => col.label);
    
    // Create CSV rows with proper escaping
    const csvRows = cases.map(caseItem => {
      return columns.filter(col => col.key !== 'actions').map(col => {
        let value = '';
        switch (col.key) {
          case 'totalDefendants':
            value = caseItem.defendants.length.toString();
            break;
          case 'shortestDetention':
            const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
            if (detainedDefendants.length === 0) {
              value = 'Không có';
            } else {
              const shortestDays = Math.min(...detainedDefendants.map(d => getDaysRemaining(d.detentionDeadline!)));
              value = `${shortestDays} ngày`;
            }
            break;
          case 'investigationRemaining':
            value = `${getDaysRemaining(caseItem.investigationDeadline)} ngày`;
            break;
          case 'shortestDetentionRemaining':
            const detainedDefs = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
            if (detainedDefs.length === 0) {
              value = 'Không có';
            } else {
              const shortestDetentionDays = Math.min(...detainedDefs.map(d => getDaysRemaining(d.detentionDeadline!)));
              value = `${shortestDetentionDays} ngày`;
            }
            break;
          case 'notes':
            value = caseItem.notes || '';
            break;
          default:
            const cellValue = caseItem[col.key as keyof Case];
            value = cellValue ? cellValue.toString() : '';
        }
        return value;
      });
    });

    // Create CSV content with proper formatting
    const csvContent = [
      headers.join('\t'), // Use tab separator for better Excel compatibility
      ...csvRows.map(row => row.join('\t'))
    ].join('\n');

    // Add BOM for UTF-8 to ensure proper display in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `danh-sach-vu-an-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStageActions = (caseItem: Case) => {
    const actions = [];
    
    switch (caseItem.stage) {
      case 'Điều tra':
        actions.push(
          <button
            key="prosecution"
            onClick={() => onTransferStage(caseItem.id, 'Truy tố')}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={12} />
            Chuyển TT
          </button>
        );
        break;
      case 'Truy tố':
        actions.push(
          <button
            key="trial"
            onClick={() => onTransferStage(caseItem.id, 'Xét xử')}
            className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors whitespace-nowrap"
          >
            <ArrowRight size={12} />
            Chuyển XX
          </button>
        );
        break;
      case 'Xét xử':
        actions.push(
          <button
            key="complete"
            onClick={() => onTransferStage(caseItem.id, 'Hoàn thành')}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            <CheckCircle size={12} />
            Hoàn thành
          </button>
        );
        break;
    }

    // Add other actions for active stages
    if (!['Hoàn thành', 'Đình chỉ', 'Chuyển đi'].includes(caseItem.stage)) {
      actions.push(
        <button
          key="transfer"
          onClick={() => onTransferStage(caseItem.id, 'Chuyển đi')}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 transition-colors whitespace-nowrap"
        >
          <Send size={12} />
          Chuyển đi
        </button>
      );
      
      actions.push(
        <button
          key="suspend"
          onClick={() => onTransferStage(caseItem.id, 'Tạm đình chỉ')}
          className="flex items-center gap-1 px-2 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors whitespace-nowrap"
        >
          <PauseCircle size={12} />
          Tạm ĐC
        </button>
      );
      
      actions.push(
        <button
          key="discontinue"
          onClick={() => onTransferStage(caseItem.id, 'Đình chỉ')}
          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          <StopCircle size={12} />
          Đình chỉ
        </button>
      );
    }

    return actions;
  };

  const renderCaseNameCell = (caseItem: Case) => {
    return (
      <div className="max-w-xs">
        <div className="font-medium text-gray-900 truncate" title={caseItem.name}>
          {caseItem.name}
        </div>
        <div className="text-sm text-gray-500 truncate" title={caseItem.charges}>
          {caseItem.charges}
        </div>
      </div>
    );
  };

  const renderNotesCell = (caseItem: Case) => {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setNotesCase(caseItem)}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
          title="Xem/Sửa ghi chú"
        >
          <MessageSquare size={12} />
          Ghi chú
        </button>
        {caseItem.notes && (
          <div className="max-w-xs">
            <div className="text-sm text-gray-600 truncate" title={caseItem.notes}>
              {caseItem.notes}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCellContent = (caseItem: Case, column: typeof columns[0]) => {
    switch (column.key) {
      case 'name':
        return renderCaseNameCell(caseItem);
      case 'totalDefendants':
        return `${caseItem.defendants.length} bị can`;
      case 'shortestDetention':
        const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
        if (detainedDefendants.length === 0) return 'Không có';
        const shortestDays = Math.min(...detainedDefendants.map(d => getDaysRemaining(d.detentionDeadline!)));
        return `${shortestDays} ngày`;
      case 'investigationRemaining':
        const remaining = getDaysRemaining(caseItem.investigationDeadline);
        return `${remaining} ngày`;
      case 'shortestDetentionRemaining':
        const detainedDefs = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
        if (detainedDefs.length === 0) return 'Không có';
        const shortestDetentionDays = Math.min(...detainedDefs.map(d => getDaysRemaining(d.detentionDeadline!)));
        return `${shortestDetentionDays} ngày`;
      case 'notes':
        return renderNotesCell(caseItem);
      case 'actions':
        const stageActions = getStageActions(caseItem);
        const isExpanded = expandedActions.has(caseItem.id);
        
        return (
          <div className="relative">
            <div className="flex items-center gap-1">
              {/* Always show Edit button */}
              <button
                onClick={() => setEditingCase(caseItem)}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors whitespace-nowrap"
              >
                <Edit2 size={12} />
                Sửa
              </button>
              
              {/* Extension button for investigation stage */}
              {caseItem.stage === 'Điều tra' && (
                <button
                  onClick={() => setExtensionModal({ case: caseItem, type: 'investigation' })}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  <Clock size={12} />
                  Gia hạn ĐT
                </button>
              )}
              
              {/* Show first action if available */}
              {stageActions.length > 0 && stageActions[0]}
              
              {/* More actions button if there are additional actions */}
              {stageActions.length > 1 && (
                <button
                  onClick={() => toggleActions(caseItem.id)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  <MoreHorizontal size={12} />
                </button>
              )}
            </div>
            
            {/* Expanded actions dropdown */}
            {isExpanded && stageActions.length > 1 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-max">
                <div className="p-2 space-y-1">
                  {stageActions.slice(1).map((action, index) => (
                    <div key={index} className="block">
                      {action}
                    </div>
                  ))}
                  <button
                    onClick={() => setConfirmDelete(caseItem.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors whitespace-nowrap w-full"
                  >
                    <Trash2 size={12} />
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        if (column.render) {
          return column.render(caseItem);
        }
        return caseItem[column.key as keyof Case];
    }
  };

  const isRowHighlighted = (caseItem: Case) => {
    if (!showWarnings) return false;
    
    if (caseItem.stage === 'Điều tra' && isExpiringSoon(caseItem.investigationDeadline)) {
      return true;
    }
    
    const detainedDefendants = caseItem.defendants.filter(d => d.preventiveMeasure === 'Tạm giam' && d.detentionDeadline);
    return detainedDefendants.some(d => isExpiringSoon(d.detentionDeadline!));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Export Button */}
      {cases.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Xuất Excel
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mở rộng
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cases.map((caseItem) => (
              <React.Fragment key={caseItem.id}>
                <tr className={`${isRowHighlighted(caseItem) ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleExpanded(caseItem.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {expandedCases.has(caseItem.id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                      {renderCellContent(caseItem, column)}
                    </td>
                  ))}
                </tr>
                {expandedCases.has(caseItem.id) && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Chi tiết Bị Can:</h4>
                        {caseItem.defendants.map((defendant, index) => (
                          <div key={index} className="bg-white p-3 rounded border">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Tên:</span> {defendant.name}
                              </div>
                              <div>
                                <span className="font-medium">Tội danh:</span> {defendant.charges}
                              </div>
                              <div>
                                <span className="font-medium">Biện pháp:</span> {defendant.preventiveMeasure}
                              </div>
                              {defendant.preventiveMeasure === 'Tạm giam' && defendant.detentionDeadline && (
                                <div className="flex items-center gap-2">
                                  <div>
                                    <span className="font-medium">Hạn tạm giam:</span> {defendant.detentionDeadline}
                                    <span className={`ml-2 ${isExpiringSoon(defendant.detentionDeadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                      ({getDaysRemaining(defendant.detentionDeadline)} ngày)
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setExtensionModal({ case: caseItem, type: 'detention', defendant })}
                                    className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
                                  >
                                    <Clock size={12} />
                                    Gia hạn
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {cases.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có vụ án nào
        </div>
      )}

      {/* Edit Modal */}
      {editingCase && (
        <CaseEditModal
          case={editingCase}
          onSave={onUpdateCase}
          onClose={() => setEditingCase(null)}
        />
      )}

      {/* Notes Modal */}
      {notesCase && (
        <NotesModal
          case={notesCase}
          onSave={onUpdateCase}
          onClose={() => setNotesCase(null)}
        />
      )}

      {/* Extension Modal */}
      {extensionModal && (
        <ExtensionModal
          case={extensionModal.case}
          type={extensionModal.type}
          defendant={extensionModal.defendant}
          onSave={onUpdateCase}
          onClose={() => setExtensionModal(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa vụ án này không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  onDeleteCase(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseTable;