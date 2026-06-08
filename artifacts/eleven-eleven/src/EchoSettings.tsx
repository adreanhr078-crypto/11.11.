/**
 * EchoSettings.tsx — Settings modal for the Echo Mind AI
 *
 * The frontend is a static SPA with no backend, so the user must supply
 * their own OpenAI API key (BYO-key) for the chat to work like ChatGPT.
 * The key is stored ONLY in localStorage — never sent to a server.
 *
 * A small model selector lets the user pick between gpt-4o-mini (cheap,
 * fast, default) and gpt-4o (higher quality, more expensive).
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  hasApiKey,
  setApiKey,
  clearApiKey,
  OPENAI_KEY_STORAGE,
} from "./echoService";

const MODEL_KEY = "eleven_echo_model";
type ModelId = "gpt-4o-mini" | "gpt-4o";
const MODELS: { id: ModelId; label: string; desc: string }[] = [
  { id: "gpt-4o-mini", label: "GPT-4o mini",  desc: "سريع · اقتصادي · يكفي للمحادثات القصيرة" },
  { id: "gpt-4o",       label: "GPT-4o",       desc: "جودة أعلى · أبطأ · أغلى" },
];

export function getStoredModel(): ModelId {
  try {
    const v = localStorage.getItem(MODEL_KEY);
    if (v === "gpt-4o" || v === "gpt-4o-mini") return v;
  } catch { /* ignore */ }
  return "gpt-4o-mini";
}

export function setStoredModel(m: ModelId): void {
  try { localStorage.setItem(MODEL_KEY, m); } catch { /* ignore */ }
}

export interface EchoSettingsProps {
  open: boolean;
  onClose: () => void;
  /** Called whenever the user saves a new key — the chat will retry. */
  onChange?: () => void;
}

export function EchoSettingsPanel({ open, onClose, onChange }: EchoSettingsProps) {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [model, setModel] = useState<ModelId>(getStoredModel);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHasKey(hasApiKey());
    setModel(getStoredModel());
    setSaved(false);
    setKeyInput("");
  }, [open]);

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (!trimmed || trimmed.length < 20) return;
    setApiKey(trimmed);
    setHasKey(true);
    setSaved(true);
    onChange?.();
    setTimeout(() => { onClose(); }, 700);
  };

  const handleClear = () => {
    if (!confirm("سيتم حذف مفتاح OpenAI من هذا المتصفح. متابعة؟")) return;
    clearApiKey();
    setHasKey(false);
    setKeyInput("");
    onChange?.();
  };

  const handleModelChange = (m: ModelId) => {
    setModel(m);
    setStoredModel(m);
    onChange?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="echo-settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/92 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-md bg-[#070707] border border-primary/35 shadow-[0_0_60px_rgba(180,0,0,0.18)] p-6 font-mono"
          >
            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-primary/55" />
            <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-primary/55" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-primary/15" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-primary/15" />

            {/* Header */}
            <div className="mb-5">
              <p className="text-[8px] tracking-[0.45em] text-primary/40 mb-1 uppercase">Echo Mind // Config</p>
              <h2 className="text-sm text-primary tracking-[0.3em]">إعدادات الذكاء</h2>
              <div className="w-full h-px bg-gradient-to-r from-primary/30 via-primary/10 to-transparent mt-3" />
            </div>

            {/* Status */}
            <div className="mb-4 flex items-center gap-2 text-[10px]">
              <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? "bg-green-500" : "bg-primary/40"}`}
                style={{ animation: hasKey ? "blink 1.4s step-end infinite" : undefined }} />
              <span className="text-muted-foreground/70 tracking-widest">
                {hasKey ? "المفتاح مُهيّأ — يمكنك الدردشة الآن" : "لا يوجد مفتاح — أدخل واحداً للبدء"}
              </span>
            </div>

            {/* API key input */}
            <div className="mb-4">
              <label className="block text-[9px] tracking-widest text-muted-foreground/55 mb-1.5 uppercase">
                OpenAI API Key
              </label>
              <div className="flex gap-1.5">
                <input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={hasKey ? "•••••••••••••••••••••••• (محفوظ)" : "sk-..."}
                  className="flex-1 bg-background/60 border border-primary/25 focus:border-primary/55 focus:outline-none text-xs px-3 py-2 placeholder:text-muted-foreground/30 rounded-none"
                  dir="ltr"
                  data-testid="input-openai-key"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="px-2 text-[9px] text-muted-foreground/60 hover:text-primary border border-primary/15 hover:border-primary/35 tracking-widest"
                  title={showKey ? "إخفاء" : "إظهار"}
                >
                  {showKey ? "🙈" : "👁"}
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground/40 mt-1.5 leading-relaxed">
                المفتاح يُحفظ محلياً في متصفحك فقط (localStorage). لا يُرسل لأي خادم.
                تحصل عليه من <span className="text-primary/55">platform.openai.com/api-keys</span>.
              </p>
            </div>

            {/* Model picker */}
            <div className="mb-5">
              <label className="block text-[9px] tracking-widest text-muted-foreground/55 mb-1.5 uppercase">
                النموذج
              </label>
              <div className="flex flex-col gap-1.5">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModelChange(m.id)}
                    data-testid={`button-model-${m.id}`}
                    className={`text-start border p-2.5 transition-all ${
                      model === m.id
                        ? "border-primary/55 bg-primary/8"
                        : "border-primary/15 bg-background/30 hover:border-primary/35"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] tracking-wide ${model === m.id ? "text-primary" : "text-foreground/85"}`}>
                        {m.label}
                      </span>
                      <span className={`text-[9px] ${model === m.id ? "text-primary" : "text-muted-foreground/40"}`}>
                        {model === m.id ? "◈ نشط" : "○"}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted-foreground/55 mt-0.5" dir="rtl">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {hasKey ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[9px] text-red-400/70 hover:text-red-400 tracking-widest transition-colors"
                >
                  مسح المفتاح
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground tracking-widest px-3 py-1.5"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={keyInput.trim().length < 20}
                  data-testid="button-save-openai-key"
                  className="text-[10px] tracking-widest px-4 py-1.5 border border-primary/40 bg-primary/12 hover:bg-primary/22 text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {saved ? "✓ تم الحفظ" : "حفظ"}
                </button>
              </div>
            </div>

            {/* Tip */}
            <div className="mt-5 border-t border-primary/12 pt-3">
              <p className="text-[9px] text-muted-foreground/40 leading-relaxed" dir="rtl">
                💡 إذا ظهرت رسالة "مفتاح غير صالح" افتح platform.openai.com وتأكد أن
                المفتاح نشط ويبدأ بـ <span className="text-primary/50">sk-</span> وله صلاحية الوصول لـ
                نموذج <span className="text-primary/50">gpt-4o-mini</span>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Tiny icon button that opens the settings panel — drop into the toolbar. */
export function EchoSettingsButton({ onOpen, hasKey }: { onOpen: () => void; hasKey: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="إعدادات OpenAI"
      data-testid="button-echo-settings"
      className={`relative text-[9px] tracking-widest border px-2 py-1 transition-all duration-300 ${
        hasKey
          ? "border-green-500/40 text-green-500/80 bg-green-500/5 hover:bg-green-500/10"
          : "border-primary/45 text-primary bg-primary/8 hover:bg-primary/18"
      }`}
    >
      <span className="inline-block mr-1">{hasKey ? "◈" : "⚙"}</span>
      {hasKey ? "OPENAI · OK" : "OPENAI KEY"}
    </button>
  );
}
