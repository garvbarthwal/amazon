"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, RotateCcw, Send, ArrowLeft, Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { useConv, type ConvPay, type ConvCartLine, type ConvQuestion } from "@/lib/conv-store";
import { usePredictionStore } from "@/lib/prediction-store";
import { ProductTile } from "@/components/product-tile";
import { formatRupees } from "@/lib/format";
import { isRecurring } from "@/lib/recurring";
import type { ConvApiResponse } from "@/app/api/conversation/route";

const SUGGESTIONS = [
  { label: "🍿 Movie night snacks", text: "snacks and cold drinks for movie night" },
  { label: "🍳 Breakfast for tomorrow", text: "breakfast for tomorrow" },
  { label: "💧 Cold drinks for guests", text: "cold drinks for 6 guests" },
];

// Last-resort fallback if the questions endpoint and its own LLM fallback both fail.
const FALLBACK_QUESTIONS: ConvQuestion[] = [
  { key: "group_size", prompt: "How many people is this for?", options: ["1", "2", "4", "6", "8+"] },
  { key: "taste",      prompt: "Sweet, savoury, or both?",      options: ["sweet", "savoury", "both"] },
  { key: "healthy",    prompt: "Keep it healthy?",              options: ["yes", "no", "doesn't matter"] },
];

const PAY_METHODS: Array<{ key: ConvPay; icon: string; label: string }> = [
  { key: "upi", icon: "📱", label: "UPI · GPay / PhonePe / Paytm" },
  { key: "card", icon: "💳", label: "Credit / Debit card" },
  { key: "cod", icon: "💵", label: "Cash on delivery" },
];

const PAY_LABEL: Record<ConvPay, string> = {
  upi: "UPI",
  card: "card",
  cod: "cash on delivery",
};

const ETA_MIN = 13;

export function ConversationalModal() {
  const open = useConv((s) => s.open);
  const step = useConv((s) => s.step);
  const messages = useConv((s) => s.messages);
  const input = useConv((s) => s.input);
  const busy = useConv((s) => s.busy);
  const cart = useConv((s) => s.cart);
  const pay = useConv((s) => s.pay);
  const order = useConv((s) => s.order);
  const close = useConv((s) => s.close);
  const reset = useConv((s) => s.reset);
  const setInput = useConv((s) => s.setInput);
  const pushMessage = useConv((s) => s.pushMessage);
  const setBusy = useConv((s) => s.setBusy);
  const setCartLines = useConv((s) => s.setCartLines);
  const inc = useConv((s) => s.inc);
  const dec = useConv((s) => s.dec);
  const removeOne = useConv((s) => s.removeOne);
  const setStep = useConv((s) => s.setStep);
  const setPay = useConv((s) => s.setPay);
  const setOrder = useConv((s) => s.setOrder);
  const clearCart = useConv((s) => s.clearCart);
  const startQuery = useConv((s) => s.startQuery);
  const recordAnswer = useConv((s) => s.recordAnswer);
  const advanceQ = useConv((s) => s.advanceQ);
  const clearPending = useConv((s) => s.clearPending);
  const qIndex = useConv((s) => s.qIndex);
  const pendingQuestions = useConv((s) => s.pendingQuestions);

  const appendOrder = usePredictionStore((s) => s.appendOrder);

  const chatRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages, busy]);

  useEffect(() => {
    if (!(open && step === "chat")) return;
    const t = setTimeout(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }, 360);
    return () => clearTimeout(t);
  }, [open, step]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  if (!open) return null;

  const lines = Object.values(cart).filter((l) => l.qty > 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const eta = lines.length ? ETA_MIN : ETA_MIN;

  const callApi = async (query: string, parameters: Record<string, string>) => {
    const res = await fetch("/api/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, parameters }),
    });
    return (await res.json()) as ConvApiResponse;
  };

  const fetchQuestions = async (query: string): Promise<ConvQuestion[]> => {
    try {
      const res = await fetch("/api/conversation/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return FALLBACK_QUESTIONS;
      const j = (await res.json()) as { questions?: ConvQuestion[] };
      return j.questions && j.questions.length > 0 ? j.questions : FALLBACK_QUESTIONS;
    } catch {
      return FALLBACK_QUESTIONS;
    }
  };

  const applyResponse = (data: ConvApiResponse) => {
    if (data.items && data.items.length > 0) {
      setCartLines(data.items as ConvCartLine[]);
    }
    pushMessage({ role: "assistant", text: data.reply || "Done — anything else?" });
  };

  // Submit a single answer to the current question. If it was the last one,
  // fire the API in one go with all collected parameters.
  const submitAnswer = async (answer: string) => {
    const state = useConv.getState();
    const qs = state.pendingQuestions;
    if (state.qIndex < 0 || state.qIndex >= qs.length) return;
    const q = qs[state.qIndex];

    pushMessage({ role: "user", text: answer });
    recordAnswer(q.key, answer);
    advanceQ();

    const after = useConv.getState();
    if (after.qIndex < after.pendingQuestions.length) {
      pushMessage({ role: "assistant", text: after.pendingQuestions[after.qIndex].prompt });
      return;
    }

    // All answered — fire the API.
    setBusy(true);
    try {
      const data = await callApi(after.pendingQuery, after.pendingParameters);
      clearPending();
      applyResponse(data);
    } catch {
      pushMessage({
        role: "assistant",
        text: "Sorry, something went wrong on my end. Try again?",
      });
      clearPending();
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const state = useConv.getState();
    const answeringQ =
      state.qIndex >= 0 && state.qIndex < state.pendingQuestions.length;

    setInput("");

    if (answeringQ) {
      // User typed an answer instead of clicking a chip.
      await submitAnswer(text);
      return;
    }

    // Brand-new query — fetch query-specific questions, then ask Q1.
    pushMessage({ role: "user", text });
    setBusy(true);
    try {
      const questions = await fetchQuestions(text);
      startQuery(text, questions);
      pushMessage({ role: "assistant", text: questions[0].prompt });
    } finally {
      setBusy(false);
    }
  };

  const goCheckout = () => {
    if (count === 0) { toast("Add something to your cart first"); return; }
    setStep("checkout");
  };

  const payNow = async () => {
    setStep("paying");
    // SmartCart productIds are foreign to the local catalog, so the orders
    // endpoint will reject them — we keep the call for telemetry but fall back
    // to a client-generated order id either way.
    const orderItems = lines.map((l) => ({ productId: l.productId, qty: l.qty }));
    const payload = JSON.stringify({ items: orderItems, paymentMethod: pay });
    const start = Date.now();
    let serverOrderId: string | null = null;
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
      if (r.ok) {
        const j = (await r.json()) as { orderId?: string };
        serverOrderId = j.orderId ?? null;
      }
    } catch {}
    const elapsed = Date.now() - start;
    if (elapsed < 2100) await new Promise((r) => setTimeout(r, 2100 - elapsed));

    const recurring = lines
      .filter((l) => isRecurring({ name: l.name, brand: l.brand, tags: l.subCategory ? [l.subCategory] : [] }))
      .map((l) => l.productId);
    appendOrder(recurring);

    const id = serverOrderId
      ? "AP" + serverOrderId.slice(-8).toUpperCase().padStart(8, "0")
      : "AP" + Date.now().toString().slice(-8);
    setOrder({ id, total: subtotal, count, eta });
    clearCart();
    setStep("done");
  };

  const finish = () => { close(); setTimeout(reset, 200); };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-3 py-6"
      style={{ background: "rgba(15,20,28,0.55)", backdropFilter: "blur(6px)" }}
      onClick={() => { if (step === "chat") finish(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.2, 0.8, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[1080px] h-[min(88vh,760px)] bg-[#f4f6f7] rounded-[20px] overflow-hidden flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div
          className="text-white px-[22px] py-[16px] flex items-center gap-3 shrink-0"
          style={{ background: "linear-gradient(120deg,#131921 0%,#232f3e 60%,#37475a 100%)" }}
        >
          <div
            className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#5b3df5,#7b2ff7)", boxShadow: "0 4px 14px rgba(91,61,245,0.5)" }}
          >
            <Sparkles size={22} fill="#fff" stroke="none" />
          </div>
          <div className="flex-1">
            <div className="text-[18px] font-extrabold tracking-[-0.3px]">
              Amazon Picks{" "}
              <span className="text-[11px] font-bold bg-[rgba(123,47,247,0.25)] text-[#c8b8ff] px-[7px] py-[2px] rounded-[5px] align-middle">
                CONVERSATIONAL · AI
              </span>
            </div>
            <div className="text-[12.5px] text-[#c8d0d8]">
              Chat your cart together — adjust and checkout in seconds.
            </div>
          </div>
          <button
            onClick={reset}
            className="bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.22)] border-0 text-white text-[12px] font-bold px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1"
          >
            <RotateCcw size={13} /> New chat
          </button>
          <button
            onClick={finish}
            className="w-[34px] h-[34px] rounded-full border-0 bg-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.26)] text-white cursor-pointer flex items-center justify-center"
          >
            <X size={17} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] min-h-0"
            >
              {/* Chat column */}
              <div className="flex flex-col min-h-0 border-r border-[#e3e6e8] bg-white">
                <div ref={chatRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                  {messages.map((m, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                      className={m.role === "user" ? "self-end max-w-[78%]" : "self-start max-w-[82%] flex gap-[9px]"}
                    >
                      {m.role === "assistant" && (
                        <div className="w-[28px] h-[28px] rounded-lg bg-[#131921] flex items-center justify-center shrink-0">
                          <Sparkles size={15} fill="#a796ff" stroke="none" />
                        </div>
                      )}
                      <div
                        className="text-[14px] leading-[1.5] px-[15px] py-[11px]"
                        style={
                          m.role === "user"
                            ? {
                                background: "linear-gradient(120deg,#5b3df5,#7b2ff7)",
                                color: "#fff",
                                fontWeight: 600,
                                borderRadius: "16px 16px 4px 16px",
                              }
                            : {
                                background: "#f0f2f4",
                                color: "#0f1111",
                                borderRadius: "4px 16px 16px 16px",
                              }
                        }
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                  {busy && (
                    <div className="self-start flex gap-[9px]">
                      <div className="w-[28px] h-[28px] rounded-lg bg-[#131921] flex items-center justify-center shrink-0">
                        <Sparkles size={15} fill="#a796ff" stroke="none" />
                      </div>
                      <div className="bg-[#f0f2f4] px-4 py-[14px] flex items-center gap-[5px]" style={{ borderRadius: "4px 16px 16px 16px" }}>
                        <span className="w-[7px] h-[7px] rounded-full bg-[#8a8f94] animate-[ap-pulse_1s_ease-in-out_infinite]" />
                        <span className="w-[7px] h-[7px] rounded-full bg-[#8a8f94] animate-[ap-pulse_1s_ease-in-out_infinite] [animation-delay:0.2s]" />
                        <span className="w-[7px] h-[7px] rounded-full bg-[#8a8f94] animate-[ap-pulse_1s_ease-in-out_infinite] [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>
                {/* Composer */}
                <div className="p-[12px_16px_16px] border-t border-[#eee] bg-white">
                  <div className="flex flex-wrap gap-[7px] mb-[10px]">
                    {qIndex >= 0 && qIndex < pendingQuestions.length
                      ? pendingQuestions[qIndex].options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => submitAnswer(opt)}
                            disabled={busy}
                            className="bg-[#f0ecff] hover:bg-[#e6dffd] border border-[#a796ff] text-[#37475a] text-[12px] font-bold px-[11px] py-[6px] rounded-[16px] cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {opt}
                          </button>
                        ))
                      : SUGGESTIONS.map((s) => (
                          <button
                            key={s.label}
                            onClick={() => setInput(s.text)}
                            className="bg-[#f3f4f4] hover:bg-[#f0ecff] hover:border-[#a796ff] border border-[#e0e0e0] text-[#37475a] text-[12px] px-[11px] py-[6px] rounded-[16px] cursor-pointer transition-colors"
                          >
                            {s.label}
                          </button>
                        ))}
                  </div>
                  <div className="flex gap-[10px] items-end">
                    <textarea
                      ref={taRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder={
                        qIndex >= 0 && qIndex < pendingQuestions.length
                          ? "Tap an option above, or type your own…"
                          : "Tell me what you need…"
                      }
                      rows={1}
                      className="flex-1 min-h-[46px] max-h-[120px] resize-none border-[1.5px] border-[#e0e0e0] rounded-[12px] px-[14px] py-[12px] text-[14px] outline-none box-border text-[#0f1111] leading-[1.4] focus:border-[#7b2ff7]"
                    />
                    <button
                      onClick={send}
                      disabled={busy || !input.trim()}
                      className="w-[46px] h-[46px] border-0 rounded-[12px] cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
                      style={{ background: "linear-gradient(95deg,#5b3df5,#7b2ff7)" }}
                    >
                      <Send size={20} stroke="#fff" strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Live cart column */}
              <div className="flex flex-col min-h-0 bg-[#f7f8f8]">
                <div className="px-[18px] pt-4 pb-[10px] shrink-0">
                  <div className="text-[15px] font-extrabold text-[#0f1111]">Your cart</div>
                  <div className="text-[12px] text-[#565959]">
                    {count} item{count === 1 ? "" : "s"} · {eta} min delivery
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-[14px] flex flex-col gap-[9px]">
                  {lines.length === 0 ? (
                    <div className="text-center text-[#8a8f94] text-[13px] px-4 py-[30px] leading-[1.7]">
                      🛒
                      <br />
                      Items you ask for will appear here.
                    </div>
                  ) : (
                    lines.map((l) => (
                      <div
                        key={l.productId}
                        className="grid grid-cols-[46px_1fr] gap-[10px] items-center bg-white border border-[#ececec] rounded-[10px] p-[9px]"
                      >
                        <div className="w-[46px] h-[46px] rounded-[7px] overflow-hidden">
                          <ProductTile
                            product={{ name: l.name, brand: l.brand, size: l.size, img: l.img, tags: l.subCategory ? [l.subCategory] : [] }}
                            size="thumb-xs"
                            showSize={false}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-bold text-[#0f1111] leading-[1.2] line-clamp-1">
                            {l.name}
                          </div>
                          <div className="text-[13px] font-extrabold text-[#0f1111] mt-[2px]">
                            ₹{formatRupees(l.price * l.qty)}
                          </div>
                          <div className="flex items-center gap-2 mt-[5px]">
                            <div className="flex items-center border border-[#d5d9d9] rounded-[7px] overflow-hidden">
                              <button onClick={() => dec(l.productId)} className="w-[26px] h-[24px] border-0 bg-[#f0f2f2] text-[14px] font-bold cursor-pointer">−</button>
                              <span className="w-[26px] text-center text-[12px] font-bold">{l.qty}</span>
                              <button onClick={() => inc(l.productId)} className="w-[26px] h-[24px] border-0 bg-[#f0f2f2] text-[14px] font-bold cursor-pointer">+</button>
                            </div>
                            <button onClick={() => removeOne(l.productId)} className="bg-transparent border-0 text-[#8a8f94] hover:text-[#cc0c39] text-[11px] cursor-pointer">
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-[14px] border-t border-[#e3e6e8] shrink-0 bg-[#f7f8f8]">
                  <div className="flex justify-between items-baseline mb-[10px]">
                    <span className="text-[13px] text-[#565959]">Subtotal</span>
                    <span className="text-[20px] font-extrabold">₹{formatRupees(subtotal)}</span>
                  </div>
                  <button
                    onClick={goCheckout}
                    disabled={count === 0}
                    className="w-full h-[46px] border-0 rounded-[23px] cursor-pointer text-white font-extrabold text-[15px] disabled:opacity-50"
                    style={{ background: "linear-gradient(120deg,#5b3df5,#7b2ff7)" }}
                  >
                    Checkout · ₹{formatRupees(subtotal)}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-6 flex justify-center"
            >
              <div className="w-full max-w-[560px]">
                <button
                  onClick={() => setStep("chat")}
                  className="bg-transparent border-0 text-[#007185] text-[13px] font-bold cursor-pointer flex items-center gap-1 mb-[14px]"
                >
                  <ArrowLeft size={14} /> Back to chat
                </button>
                <div className="bg-white border border-[#e7e7e7] rounded-xl p-[18px] mb-[14px]">
                  <div className="flex items-center gap-[9px] mb-2">
                    <span className="w-[22px] h-[22px] rounded-full bg-[#131921] text-white flex items-center justify-center text-[12px] font-extrabold">1</span>
                    <span className="text-[15px] font-extrabold">Deliver to</span>
                  </div>
                  <div className="text-[13.5px] leading-[1.5] text-[#0f1111] pl-[31px]">
                    <span className="font-bold">Garv Sharma</span> · ⚡ Express in {eta} min FREE
                    <br />
                    Flat 402, Connaught Place, New Delhi 110001
                  </div>
                </div>
                <div className="bg-white border border-[#e7e7e7] rounded-xl p-[18px] mb-[14px]">
                  <div className="flex items-center gap-[9px] mb-3">
                    <span className="w-[22px] h-[22px] rounded-full bg-[#131921] text-white flex items-center justify-center text-[12px] font-extrabold">2</span>
                    <span className="text-[15px] font-extrabold">Payment method</span>
                  </div>
                  <div className="flex flex-col gap-[9px]">
                    {PAY_METHODS.map((m) => {
                      const active = pay === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setPay(m.key)}
                          className="flex items-center gap-[11px] text-left border-2 rounded-[10px] px-[14px] py-3 cursor-pointer"
                          style={{
                            borderColor: active ? "#7b2ff7" : "#e0e0e0",
                            background: active ? "#f5f1ff" : "#fff",
                          }}
                        >
                          <span
                            className="w-[17px] h-[17px] rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{ borderColor: active ? "#7b2ff7" : "#999" }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: active ? "#7b2ff7" : "transparent" }}
                            />
                          </span>
                          <span className="text-[18px]">{m.icon}</span>
                          <span className="text-[14px] font-bold text-[#0f1111]">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white border border-[#e7e7e7] rounded-xl p-[18px]">
                  <div className="text-[15px] font-extrabold mb-3">Order summary</div>
                  <div className="flex flex-col gap-[7px] mb-3 max-h-[180px] overflow-auto">
                    {lines.map((l) => (
                      <div key={l.productId} className="flex justify-between gap-2 text-[13px] text-[#333]">
                        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{l.qty} × {l.name}</span>
                        <span className="font-bold whitespace-nowrap">₹{formatRupees(l.price * l.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#eee] pt-[10px] flex flex-col gap-[6px] text-[13.5px]">
                    <div className="flex justify-between text-[#565959]">
                      <span>Items ({count})</span>
                      <span>₹{formatRupees(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#565959]">
                      <span>Delivery</span>
                      <span className="text-[#007600] font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-[18px] font-extrabold text-[#b12704] border-t border-[#eee] pt-[9px] mt-[3px]">
                      <span>Total</span>
                      <span>₹{formatRupees(subtotal)}</span>
                    </div>
                  </div>
                  <button
                    onClick={payNow}
                    className="w-full h-[50px] mt-4 border-0 rounded-[25px] cursor-pointer text-white font-extrabold text-[16px]"
                    style={{ background: "linear-gradient(120deg,#5b3df5,#7b2ff7)" }}
                  >
                    Pay ₹{formatRupees(subtotal)} via {PAY_LABEL[pay]}
                  </button>
                  <div className="text-[11.5px] text-[#8a8f94] text-center mt-[10px] flex items-center justify-center gap-1">
                    <Lock size={11} /> Secured by Amazon Picks · 100% safe payments
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "paying" && (
            <motion.div
              key="paying"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-10 text-center"
            >
              <div
                className="w-[70px] h-[70px] rounded-full mb-[22px]"
                style={{
                  border: "5px solid #ddd5fb",
                  borderTopColor: "#7b2ff7",
                  animation: "ap-spin 0.9s linear infinite",
                }}
              />
              <div className="text-[20px] font-extrabold mb-[6px]">Processing payment…</div>
              <div className="text-[14px] text-[#565959]">
                Securely confirming with your bank. Hang tight.
              </div>
            </motion.div>
          )}

          {step === "done" && order && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-9 text-center overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.32 }}
                className="w-[74px] h-[74px] rounded-full bg-[#e7f6ec] flex items-center justify-center mb-4"
              >
                <Check size={40} stroke="#007600" strokeWidth={3} />
              </motion.div>
              <h2 className="m-0 mb-[6px] text-[24px] font-extrabold text-[#007600]">Payment successful!</h2>
              <p className="m-0 mb-5 text-[14px] text-[#565959]">Your order is confirmed and on its way.</p>
              <div className="flex gap-[26px] flex-wrap justify-center bg-[#f7f8f8] rounded-xl px-6 py-[18px] mb-[22px]">
                <div>
                  <div className="text-[11px] text-[#8a8f94] uppercase tracking-[0.05em]">Order ID</div>
                  <div className="text-[16px] font-extrabold">{order.id}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8a8f94] uppercase tracking-[0.05em]">Arriving in</div>
                  <div className="text-[16px] font-extrabold text-[#007600]">{order.eta} min</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8a8f94] uppercase tracking-[0.05em]">Items</div>
                  <div className="text-[16px] font-extrabold">{order.count}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8a8f94] uppercase tracking-[0.05em]">Paid</div>
                  <div className="text-[16px] font-extrabold">₹{formatRupees(order.total)}</div>
                </div>
              </div>
              <button
                onClick={finish}
                className="h-[46px] px-7 ap-cta-yellow rounded-[24px] font-bold text-[15px] cursor-pointer"
              >
                Continue shopping
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
