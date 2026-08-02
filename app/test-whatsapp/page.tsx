"use client";
import { useState } from 'react';
import { FaWhatsapp, FaPaperPlane, FaCheckCircle, FaExclamationTriangle, FaLock, FaMobileAlt } from 'react-icons/fa';
import { toast } from 'sonner';

export default function WhatsAppTestPage() {
  const [phone, setPhone] = useState('9866525102');
  const [token, setToken] = useState('');
  const [phoneId, setPhoneId] = useState('989505087581896');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      let url = `/api/test/whatsapp?phone=${encodeURIComponent(phone)}`;
      if (token.trim()) {
        url += `&token=${encodeURIComponent(token.trim())}`;
      }
      if (phoneId.trim()) {
        url += `&phone_id=${encodeURIComponent(phoneId.trim())}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setResult(data);

      if (data.result?.success) {
        toast.success('WhatsApp message sent successfully!');
      } else {
        toast.error(data.result?.error || 'Failed to send WhatsApp message.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error executing test.');
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-[5px] border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-[5px] bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-xs">
            <FaWhatsapp />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Meta WhatsApp API Tester
            </h1>
            <p className="text-xs font-semibold text-slate-500">
              Test sending real WhatsApp notifications via Meta Cloud API locally
            </p>
          </div>
        </div>

        <form onSubmit={handleSendTest} className="space-y-5">
          {/* Target Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FaMobileAlt className="text-slate-400" /> Target WhatsApp Mobile Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9866525102 or 919866525102"
              className="w-full px-4 py-3 border border-slate-300 rounded-[5px] text-sm font-medium focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              required
            />
            <p className="mt-1 text-[11px] text-slate-400 font-medium">
              Must be registered in your Meta Developers Dashboard "To" list for test numbers.
            </p>
          </div>

          {/* Meta Access Token */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FaLock className="text-slate-400" /> Meta Access Token (Paste from Dashboard)
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste generated Meta Access Token (starts with EAAS2...)"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-[5px] text-xs font-mono focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
            />
            <p className="mt-1 text-[11px] text-slate-400 font-medium">
              Leave blank to use default token configured in .env.local / .env.production.
            </p>
          </div>

          {/* Phone Number ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-[5px] text-xs font-mono bg-slate-50 text-slate-600 outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-[5px] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FaPaperPlane />
                <span>Send Test WhatsApp Message</span>
              </>
            )}
          </button>
        </form>

        {/* Result Output */}
        {result && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              {result.result?.success ? (
                <FaCheckCircle className="text-emerald-600 text-base" />
              ) : (
                <FaExclamationTriangle className="text-amber-600 text-base" />
              )}
              Execution Output
            </h3>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-[5px] text-xs font-mono overflow-x-auto max-h-60 scrollbar-thin">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
