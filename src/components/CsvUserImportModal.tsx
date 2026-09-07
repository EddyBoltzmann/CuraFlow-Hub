/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Check,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { AppUser } from '../types';
import {
  validateAndBuildUsersFromCsv,
  generateSampleCsvTemplate,
  CsvParseResult
} from '../utils/csvUserParser';

interface CsvUserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: AppUser[];
  onImportUsers: (newUsers: AppUser[]) => void;
  onTriggerToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CsvUserImportModal: React.FC<CsvUserImportModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  onImportUsers,
  onTriggerToast
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [csvText, setCsvText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'errors'>('all');
  const [importSummary, setImportSummary] = useState<{ count: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute parsing & validation whenever csvText or existingUsers changes
  const parseResult: CsvParseResult | null = useMemo(() => {
    if (!csvText.trim()) return null;
    return validateAndBuildUsersFromCsv(csvText, existingUsers);
  }, [csvText, existingUsers]);

  // Filter rows for display
  const displayedRows = useMemo(() => {
    if (!parseResult) return [];
    if (activeFilter === 'valid') return parseResult.rows.filter(r => r.isValid);
    if (activeFilter === 'errors') return parseResult.rows.filter(r => !r.isValid);
    return parseResult.rows;
  }, [parseResult, activeFilter]);

  const handleDownloadTemplate = () => {
    const templateContent = generateSampleCsvTemplate();
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'curaflow_users_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onTriggerToast('Sample CSV template downloaded successfully!', 'info');
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      onTriggerToast('Please upload a valid .csv file.', 'error');
      return;
    }

    setIsProcessing(true);
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setCsvText(text);
      setIsProcessing(false);
      onTriggerToast(`File "${selectedFile.name}" loaded and parsed. Review accounts below.`, 'info');
    };
    reader.onerror = () => {
      setIsProcessing(false);
      onTriggerToast('Failed to read CSV file.', 'error');
    };
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setCsvText('');
    setImportSummary(null);
    setActiveFilter('all');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.validCount === 0) {
      onTriggerToast('No valid accounts available to import.', 'error');
      return;
    }

    onImportUsers(parseResult.validUsers);
    setImportSummary({ count: parseResult.validCount });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 animate-fade-in text-slate-900 dark:text-slate-100 font-sans space-y-5 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                  Batch Provision Accounts via CSV
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Bulk Importer
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a structured CSV file to register multiple patients, clinicians, or administrators simultaneously with automated duplicate checks.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Either Success Confirmation OR Upload / Preview Flow */}
        {importSummary ? (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                Batch Import Completed Successfully!
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                <strong className="text-emerald-600 dark:text-emerald-400">{importSummary.count} user accounts</strong> have been authenticated, active credentials provisioned, and added to the user registry.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Import Another CSV</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md shadow-emerald-600/15"
              >
                View Updated Registry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            
            {/* Top Helper & Template Download Bar */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Supported Column Headers</span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  First Name, Last Name, Email, Role (patient / provider / admin), Sex, DOB, Phone, Password
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="shrink-0 py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Download standard CSV format with example rows"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>

            {/* Dropzone (shown if no file uploaded yet) */}
            {!csvText ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.005]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 stroke-[2]" />
                </div>

                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Click to select or drag & drop your CSV file here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports standard CSV files exported from spreadsheets or clinic EHRs.
                </p>

                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                  <Upload className="w-3.5 h-3.5" />
                  Browse Computer (.csv)
                </span>
              </div>
            ) : (
              /* File Loaded & Parsed: Preview Panel */
              <div className="space-y-4">
                
                {/* File summary & stats bar */}
                <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {fileName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {parseResult?.totalRows || 0} total records analyzed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="py-1.5 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Choose Different File</span>
                    </button>
                  </div>
                </div>

                {/* Status KPI Pills and Tab Filter */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activeFilter === 'all'
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span>All Records</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-black">
                        {parseResult?.totalRows || 0}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveFilter('valid')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        activeFilter === 'valid'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready to Import</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-black">
                        {parseResult?.validCount || 0}
                      </span>
                    </button>

                    {(parseResult?.errorCount || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveFilter('errors')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          activeFilter === 'errors'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Issues Found</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-mono font-black">
                          {parseResult?.errorCount}
                        </span>
                      </button>
                    )}
                  </div>

                  {parseResult && parseResult.errorCount > 0 && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ Note: Invalid rows will be safely excluded from import.
                    </span>
                  )}
                </div>

                {/* Interactive Table of Parsed Records */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/80 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Row</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Allocated ID</th>
                          <th className="py-2.5 px-3">Full Name</th>
                          <th className="py-2.5 px-3">Email</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Sex</th>
                          <th className="py-2.5 px-3">DOB</th>
                          <th className="py-2.5 px-3">Validation Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {displayedRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-400">
                              No records found in this view.
                            </td>
                          </tr>
                        ) : (
                          displayedRows.map((r) => {
                            const u = r.user;
                            return (
                              <tr
                                key={`csv-row-${r.rowNumber}`}
                                className={`transition-colors ${
                                  r.isValid
                                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                    : 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                }`}
                              >
                                <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                                  #{r.rowNumber}
                                </td>

                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {r.isValid ? (
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                      <span>Ready</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md">
                                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                                      <span>Error</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                                  {u?.id ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {u.id}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Auto</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                  {u?.name || r.raw['Name'] || r.raw['First Name'] || '—'}
                                </td>

                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {u?.email || r.raw['Email'] || r.raw['Email Address'] || '—'}
                                </td>

                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                                      (u?.role || 'patient') === 'provider'
                                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                        : (u?.role || 'patient') === 'admin'
                                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    }`}
                                  >
                                    {u?.role || 'patient'}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                                  {u?.sex || '—'}
                                </td>

                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                  {u?.dob || '—'}
                                </td>

                                <td className="py-2.5 px-3">
                                  {r.isValid ? (
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      ✓ Validated — Ready to register
                                    </span>
                                  ) : (
                                    <ul className="list-disc list-inside text-[11px] text-rose-600 dark:text-rose-400 font-semibold space-y-0.5">
                                      {r.errors.map((err, i) => (
                                        <li key={i}>{err}</li>
                                      ))}
                                    </ul>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Controls */}
        {!importSummary && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="text-xs text-slate-400">
              {parseResult && (
                <span>
                  {parseResult.validCount} valid of {parseResult.totalRows} accounts ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!parseResult || parseResult.validCount === 0 || isProcessing}
                className={`py-2 px-5 font-bold rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-md ${
                  !parseResult || parseResult.validCount === 0 || isProcessing
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {parseResult && parseResult.validCount > 0
                    ? `Import ${parseResult.validCount} Valid Accounts`
                    : 'Import Accounts'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CsvUserImportModal;
