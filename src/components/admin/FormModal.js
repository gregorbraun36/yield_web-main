import React from 'react';
import { X } from 'lucide-react';

const FormModal = ({ title, subtitle, children, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="min-h-full flex items-start justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-[#0B1E33]">{title}</h3>
            {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center"
          >
            <X size={17} />
          </button>
        </div>
          <div className="p-6 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default FormModal;
