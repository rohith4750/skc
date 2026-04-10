"use client";

import { useState } from "react";

export default function WhatsAppDashboard() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const handleSend = async () => {
    if (!phone || !message) {
      setStatus({ type: "error", message: "Please enter both phone and message" });
      return;
    }

    setStatus({ type: "loading", message: "Sending..." });

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phone, message }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus({ type: "success", message: "Message sent! ID: " + data.data.messages[0].id });
      } else {
        setStatus({ type: "error", message: data.error || "Failed to send message" });
      }
    } catch (error) {
      setStatus({ type: "error", message: "An unexpected error occurred" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            WhatsApp Meta Integration
          </h1>
          <p className="text-slate-400 mt-2">Configure, test and monitor your WhatsApp Cloud API connection.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Diagnostic Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Service Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Webhooks</span>
                <span className="text-emerald-400 text-sm font-medium">Active</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                <span className="text-slate-400 text-sm">Cloud API</span>
                <span className="text-emerald-400 text-sm font-medium">Connected</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Mode</span>
                <span className="text-amber-400 text-sm font-medium">Sandbox (Internal)</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Webhook URL</h3>
              <div className="bg-slate-900 rounded-lg p-3 flex justify-between items-center group cursor-pointer hover:bg-slate-950 transition-colors">
                <code className="text-xs text-emerald-300">/api/whatsapp/webhook</code>
                <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 uppercase tracking-widest">Handshake endpoint</span>
              </div>
            </div>
          </div>

          {/* Test Message Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6">Test Messaging</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Recipient Number</label>
                <input
                  type="text"
                  placeholder="e.g. 919701417885"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-200"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  placeholder="Hello from SKC Next.js Backend!"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-slate-200 resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={status.type === "loading"}
                className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg active:scale-95 ${
                  status.type === "loading" 
                    ? "bg-slate-700 cursor-not-allowed" 
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-500/20"
                }`}
              >
                {status.type === "loading" ? "Processing..." : "Send Test Message"}
              </button>

              {status.message && (
                <div className={`mt-4 p-4 rounded-xl text-sm border ${
                  status.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                    : "bg-rose-500/10 border-rose-500/50 text-rose-400"
                }`}>
                  {status.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documentation / Tips Card */}
        <div className="mt-8 bg-gradient-to-br from-indigo-500/5 to-emerald-500/5 border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-lg font-semibold mb-4 text-slate-300">💡 Integration Tips</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                <li className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    Use Templates for business-initiated conversations beyond 24h.
                </li>
                <li className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    Always use the full international format (e.g. 91xxxxxxxxxx).
                </li>
                <li className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    Webhooks require an HTTPS tunnel (ngrok) for local development.
                </li>
                <li className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    Respond with 200 OK within 10s to acknowledge Meta webhooks.
                </li>
            </ul>
        </div>
      </div>
    </div>
  );
}
