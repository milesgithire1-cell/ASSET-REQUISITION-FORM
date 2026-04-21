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
  quantity: number;
  unitPrice: number;
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
    { id: crypto.randomUUID(), description: '', quantity: 0, unitPrice: 0 }
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
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 0, unitPrice: 0 }]);
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
    return items.map(item => ({
      ...item,
      total: item.quantity * item.unitPrice
    }));
  }, [items]);

  const grandTotal = useMemo(() => {
    return totals.reduce((sum, item) => sum + item.total, 0);
  }, [totals]);

  const isFormValid = useMemo(() => {
    if (!employeeName.trim() || !employeeNo.trim() || !department.trim() || !purpose.trim()) {
      return false;
    }
    
    if (items.length === 0) return false;
    
    // Check if every item has a valid description, quantity > 0, and unitPrice > 0
    return items.every(item => 
      item.description.trim() !== '' && 
      item.quantity > 0 && 
      item.unitPrice > 0
    );
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
      setItems([{ id: crypto.randomUUID(), description: '', quantity: 0, unitPrice: 0 }]);

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
              <div className="relative">
                <div className="w-20 h-20 bg-white rounded-xl p-1 flex items-center justify-center shadow-lg overflow-hidden">
                  <img
                    src="/logo.svg"
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
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
                className={`input-field font-mono shadow-sm ${employeeNo || employeeName ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''}`}
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                readOnly={!!employeeName}
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
                className="input-field shadow-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                readOnly
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
            <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-3">
                Items List
                <span className="bg-white text-brand-primary px-3 py-1 rounded-full text-xs font-mono border border-brand-primary/20 shadow-sm">
                  {items.length}
                </span>
              </h2>
              <button
                onClick={addItem}
                className="no-print flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-brand-primary hover:opacity-90 px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Plus size={14} />
                Add Entry
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Description <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-24 text-center">Qty <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-36 text-right">Unit Price <span className="text-red-500">*</span></th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 w-40 text-right">Total</th>
                    <th className="px-6 py-4 w-12 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence initial={false}>
                    {totals.map((item) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        layout
                        className="group hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Enter item description..."
                            className="w-full bg-transparent outline-none focus:text-brand-primary font-medium transition-colors"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-full bg-transparent text-center outline-none font-mono focus:text-brand-primary transition-colors"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 font-mono focus-within:text-brand-primary transition-colors">
                            <span className="opacity-40 text-xs">KES</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-24 bg-transparent text-right outline-none"
                              value={item.unitPrice === 0 ? '' : item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-bold text-slate-700">
                            KES{item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center no-print">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-300 hover:text-red-500 transition-all p-1.5 rounded-md hover:bg-red-50"
                            disabled={items.length <= 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 text-slate-700 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <td colSpan={3} className="px-6 py-6 text-right font-bold uppercase tracking-[0.25em] text-[10px] opacity-80">
                      Statement Total
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-2xl font-black">
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

        {/* Legal/Footer */}
        <div className="bg-slate-50/50 px-10 py-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3">
             <span className="inline-block w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
             <span>AssetFlow Runtime Hash: {useMemo(() => crypto.randomUUID().slice(0, 16), []).toUpperCase()}</span>
          </div>
          <span className="opacity-60 text-right">Document Restricted to Internal Use Only</span>
        </div>
      </motion.div>

      {/* Info Notice */}
      <div className="max-w-4xl mx-auto mt-8 px-4 no-print">
        <div className="flex items-start gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] bg-white p-6 rounded-2xl border border-slate-200 shadow-sm leading-relaxed">
          <Calendar size={18} className="text-brand-primary shrink-0" />
          <p>
            Digitally capture your signature directly in the portal using your mouse or touch screen. 
            Once signed, click "Submit Requisition" to finalize the digital record and send it to the database. 
            Signatures are transient and will be embedded in the submission payload.
          </p>
        </div>
      </div>
    </div>
  );
}
