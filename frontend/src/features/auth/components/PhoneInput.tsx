import React from 'react';
import { Phone, XCircle, CheckCircle2 } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  disabled?: boolean;
  isVerified?: boolean;
  error?: string | null;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  disabled = false,
  isVerified = false,
  error = null,
  placeholder = '98765 43210',
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(cleanDigits);
  };

  const handleClear = () => {
    if (!disabled) {
      onChange('');
    }
  };

  // Format 10 digits as 'XXXXX XXXXX' for readability
  const formattedDisplay = value.length > 5 ? `${value.slice(0, 5)} ${value.slice(5)}` : value;

  return (
    <div className="w-full">
      <div
        className={`relative flex items-center rounded-xl border transition-all duration-200 bg-white dark:bg-slate-900/60 ${
          error
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : isVerified
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200 dark:border-slate-800 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-500/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40' : ''}`}
      >
        {/* Country Code Prefix */}
        <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-3 border-r border-slate-200 dark:border-slate-800 select-none text-slate-700 dark:text-slate-300">
          <span className="text-base" role="img" aria-label="India Flag">
            🇮🇳
          </span>
          <span className="font-semibold text-sm font-mono">+91</span>
        </div>

        {/* Input Field */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={11} // includes space in formatted
          value={formattedDisplay}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-3 text-sm font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
        />

        {/* Right Status / Action Icons */}
        <div className="flex items-center pr-3 gap-1.5">
          {isVerified ? (
            <div className="flex items-center text-emerald-500 dark:text-emerald-400 gap-1 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Verified</span>
            </div>
          ) : value.length > 0 && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          ) : (
            <Phone className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
