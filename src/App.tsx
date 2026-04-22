/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck,
  Plus, 
  Trash2, 
  Building2, 
  User, 
  Calendar,
  FileText,
  CreditCard,
  RotateCcw,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Item {
  id: string;
  description: string;
  specifications: string;
  priority: string;
  quantity: string;
  unitPrice: string;
}

const EMPLOYEE_DATA_MAP: Record<string, { department: string; employeeId: string }> = {
  "shiku.muchoki@dcash.africa": { department: "Management", employeeId: "N/A" },
  "peter.kayere@dcash.africa": { department: "Management", employeeId: "N/A" },
  "paul.wahome@dcash.africa": { department: "Business Management", employeeId: "N/A" },
  "liz.wangeci@dcash.africa": { department: "Human Resource", employeeId: "DCASH017" },
  "lenny.steve@dcash.co.ke": { department: "Marketing", employeeId: "DCASH006" },
  "charlotte.mumbi@dcash.co.ke": { department: "Marketing", employeeId: "DCASH013" },
  "ephraim.kisaka@dcash.co.ke": { department: "Marketing", employeeId: "DCASH014" },
  "mike.muiruri@dcash.co.ke": { department: "Customer Support", employeeId: "DCASH012" },
  "miles.muchoki@dcash.co.ke": { department: "Customer Support", employeeId: "DCASH022" },
  "lina.muthoni@dcash.co.ke": { department: "Customer Support", employeeId: "DCASH019" },
  "ritamargret@dcash.co.ke": { department: "Customer Support", employeeId: "DCASH007" },
  "victor.mwakireti@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH008" },
  "ian.masae@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH005" },
  "stephen.agai@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH011" },
  "victor.kilyungi@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH009" },
  "robinson.muhia@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH016" },
  "alex.njoroge@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH018" },
  "cecily.wahome@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH020" },
  "goeffrey.k.omukuba@dcash.co.ke": { department: "Tech Team", employeeId: "DCASH021" },
  "bridgetwanjiku@dcash.co.ke": { department: "Education", employeeId: "DCASH015" }
};

const AUTHORIZED_EMAILS = Object.keys(EMPLOYEE_DATA_MAP);

export default function App() {
  const getKenyanDate = () => {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Africa/Nairobi', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(new Date());
  };

  const [inquiryDate] = useState(getKenyanDate());
  const [employeeName, setEmployeeName] = useState('');
  const [employeeNo, setEmployeeNo] = useState('');
  const [department, setDepartment] = useState('');
  const [purpose, setPurpose] = useState('');
  const [items, setItems] = useState<Item[]>([
    { id: crypto.randomUUID(), description: '', specifications: '', priority: '', quantity: '', unitPrice: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleEmailChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const email = e.target.value;
    setEmployeeName(email);
    if (EMPLOYEE_DATA_MAP[email]) {
      setDepartment(EMPLOYEE_DATA_MAP[email].department);
      
      const empId = EMPLOYEE_DATA_MAP[email].employeeId;
      setEmployeeNo(empId || "");
    }
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', specifications: '', priority: '', quantity: '', unitPrice: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof Item, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const totals = useMemo(() => {
    return items.map(item => {
      const q = parseFloat(item.quantity) || 0;
      const u = parseFloat(item.unitPrice) || 0;
      return {
        ...item,
        total: q * u
      };
    });
  }, [items]);

  const grandTotal = useMemo(() => {
    return totals.reduce((sum, item) => sum + item.total, 0);
  }, [totals]);

  const isFormValid = useMemo(() => {
    if (!employeeName.trim() || !employeeNo.trim() || !department.trim() || !purpose.trim()) {
      return false;
    }
    
    if (items.length === 0) return false;
    
    // Check if every item has a valid description, specifications, quantity > 0, and unitPrice > 0
    return items.every(item => {
      const q = parseFloat(item.quantity) || 0;
      const u = parseFloat(item.unitPrice) || 0;
      return item.description.trim() !== '' && 
             item.specifications.trim() !== '' && 
             item.priority !== '' &&
             q > 0 && 
             u > 0;
    });
  }, [employeeName, employeeNo, department, purpose, items]);

  const handleSubmit = async () => {
    if (!isFormValid) {
      setErrorMessage('Please fill in all required (*) fields before submitting.');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const payload = {
        inquiryDate,
        employeeName,
        employeeNo,
        department,
        purpose,
        items,
        grandTotal
      };

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Submission failed');

      setSubmitStatus('success');
      
      // Clear the form after successful submission
      setEmployeeName('');
      setEmployeeNo('');
      setDepartment('');
      setPurpose('');
      setItems([{ id: crypto.randomUUID(), description: '', specifications: '', priority: '', quantity: '', unitPrice: '' }]);

      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Connecting to backend failed. Ensure environment variables are set.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <AnimatePresence>
        {submitStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-28 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-start gap-4 max-w-sm
              ${submitStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}
          >
            {submitStatus === 'success' ? (
              <CheckCircle2 className="shrink-0" size={24} />
            ) : (
              <AlertCircle className="shrink-0" size={24} />
            )}
            <div>
              <p className="font-bold text-sm">
                {submitStatus === 'success' ? 'Form Submitted!' : 'Submission Error'}
              </p>
              <p className="text-xs opacity-80 mt-1">
                {submitStatus === 'success' 
                  ? 'Your requisition has been successfully recorded in the digital ledger.' 
                  : errorMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200 form-container"
      >
        {/* Header Section */}
        <div className="bg-brand-text px-6 md:px-8 py-8 md:py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Asset Requisition Form</h1>
                <p className="text-white/70 font-medium tracking-wide">Digital Requisition Portal</p>
              </div>
            </div>
            <div className="text-right w-full md:w-auto">
              <div className="p-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 mb-1">
                  Requisition Date
                </label>
                <div className="text-xl font-bold w-full text-white font-mono">
                  {new Date(inquiryDate + 'T00:00:00').toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  }).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 md:p-10 space-y-8 md:space-y-10">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <label className="label-text flex items-center gap-2 mb-2">
                <User size={14} className="text-brand-primary" />
                Requester Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className="input-field shadow-sm appearance-none cursor-pointer pr-10"
                  value={employeeName}
                  onChange={handleEmailChange}
                >
                  <option value="" disabled>Select your email...</option>
                  {AUTHORIZED_EMAILS.map(email => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <label className="label-text flex items-center gap-2 mb-2">
                <CreditCard size={14} className="text-brand-primary" />
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={employeeNo ? "" : "Auto-filled from email..."}
                className={`input-field font-mono shadow-sm ${employeeNo || employeeName ? 'bg-slate-100 text-slate-600 cursor-not-allowed select-none' : ''}`}
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                disabled={!!employeeName}
                tabIndex={employeeName ? -1 : 0}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <label className="label-text flex items-center gap-2 mb-2">
                <Building2 size={14} className="text-brand-primary" />
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Auto-filled from email..."
                className="input-field shadow-sm bg-slate-100 text-slate-600 cursor-not-allowed select-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled
                tabIndex={-1}
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-2"
            >
              <label className="label-text flex items-center gap-2 mb-2">
                <FileText size={14} className="text-brand-primary" />
                Justification of Need <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Provide detailed justification for the asset requisition..."
                rows={3}
                className="input-field resize-none shadow-sm"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </motion.div>
          </div>

          {/* Items Table Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-3">
                Items List
                <span className="bg-white text-brand-primary px-3 py-1 rounded-full text-xs font-mono border border-brand-primary/20 shadow-sm">
                  {items.length}
                </span>
              </h2>
              <button
                onClick={addItem}
                className="no-print w-full sm:w-auto justify-center flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-brand-primary hover:opacity-90 px-4 py-3 sm:py-2 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus size={14} />
                Add Entry
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
              <table className="w-full text-left border-collapse block md:table">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-slate-50 border-b border-slate-200 block md:table-row">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Item Details <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-48 text-center">Priority <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-24 text-center">Qty <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-36 text-right">Unit Price <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-40 text-right">Total</th>
                    <th className="px-6 py-4 w-12 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-4 md:divide-y md:divide-slate-100 block md:table-row-group">
                  <AnimatePresence initial={false}>
                    {totals.map((item) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        layout
                        className="group hover:bg-slate-50 transition-colors flex flex-col md:table-row relative p-4 md:p-0"
                      >
                        <td className="block md:table-cell px-2 md:px-6 py-2 md:py-4 min-w-[250px] align-top">
                          <div className="md:hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Item Details <span className="text-red-500">*</span></div>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Device Name (e.g., MacBook Pro 16)"
                              className="input-field shadow-sm w-full font-semibold"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            />
                            <textarea
                              placeholder="Specifications (e.g., M3 Max, 36GB RAM, 1TB SSD...)"
                              rows={2}
                              className="input-field shadow-sm w-full text-sm resize-none"
                              value={item.specifications}
                              onChange={(e) => updateItem(item.id, 'specifications', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="block md:table-cell px-2 md:px-6 py-2 md:py-4 text-left md:text-center align-top md:pt-5">
                          <div className="md:hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Priority <span className="text-red-500">*</span></div>
                          <div className="flex flex-col md:flex-row gap-2 justify-center">
                            {['low', 'medium', 'high'].map((p) => {
                              const isSelected = item.priority === p;
                              let colors = 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100';
                              if (isSelected) {
                                if (p === 'low') colors = 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm' ;
                                if (p === 'medium') colors = 'bg-green-100 text-green-700 border-green-300 shadow-sm';
                                if (p === 'high') colors = 'bg-red-100 text-red-700 border-red-300 shadow-sm';
                              }
                              return (
                                <button
                                  key={p}
                                  onClick={() => updateItem(item.id, 'priority', p)}
                                  className={`flex-1 md:flex-none px-3 py-2 md:py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all ${colors}`}
                                  type="button"
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="block md:table-cell px-2 md:px-6 py-2 md:py-4 text-left md:text-center align-top md:pt-5">
                          <div className="md:hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Quantity <span className="text-red-500">*</span></div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="input-field shadow-sm w-full md:mx-auto md:w-20 md:text-center font-mono hide-spin-button"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="block md:table-cell px-2 md:px-6 py-2 md:py-4 text-left md:text-right align-top md:pt-5">
                          <div className="md:hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Unit Price <span className="text-red-500">*</span></div>
                          <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary transition-all duration-200 shadow-sm w-full md:w-32 md:ml-auto">
                            <span className="text-slate-400 text-xs font-semibold mr-1 select-none">KES</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full bg-transparent text-right outline-none text-brand-text font-mono hide-spin-button"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="block md:table-cell px-2 md:px-6 py-4 mt-2 md:mt-0 text-left md:text-right align-top md:pt-5 bg-slate-50 md:bg-transparent rounded-lg md:rounded-none">
                          <div className="flex justify-between items-center md:block">
                            <div className="md:hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Total</div>
                            <span className="font-mono font-bold text-slate-700 text-lg md:text-base">
                              KES{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </td>
                        <td className="block md:table-cell px-2 md:px-6 py-2 text-center no-print align-top md:pt-4 absolute md:relative top-2 right-2 md:top-auto md:right-auto">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="bg-white md:bg-transparent absolute top-0 right-0 md:relative text-slate-400 shadow-sm md:shadow-none border border-slate-200 md:border-transparent hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 hover:border-red-200"
                            disabled={items.length <= 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
                <tfoot className="block md:table-footer-group border-t-4 border-slate-200 md:border-transparent">
                  <tr className="bg-slate-100 text-slate-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex flex-col md:table-row">
                    <td colSpan={4} className="hidden md:table-cell px-6 py-6 text-right font-bold uppercase tracking-[0.25em] text-[10px] opacity-80">
                      Statement Total
                    </td>
                    <td className="block md:table-cell px-6 py-6 text-center md:text-right">
                      <div className="md:hidden text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Statement Total</div>
                      <div className="flex items-center justify-center md:justify-end gap-2 text-3xl md:text-2xl font-black text-brand-primary md:text-slate-700">
                        <span className="text-sm opacity-50">KES</span>
                        <span className="font-mono">
                          {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          
          {/* Form Submission Button */}
          <div className="flex justify-center pt-8 no-print border-t border-slate-50">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
              className={`group w-full flex items-center justify-center gap-3 px-10 py-4 rounded-xl shadow-xl transition-all font-bold text-base text-white
                ${isSubmitting || !isFormValid 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-brand-primary hover:shadow-brand-primary/20 hover:scale-[1.01] active:scale-95'}`}
            >
              {isSubmitting ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Submit Requisition</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
