
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage, KnowledgeBase } from '../types';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface AssistantChatProps {
  kb: KnowledgeBase | null;
}

const AssistantChat: React.FC<AssistantChatProps> = ({ kb }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'AI Blueprint Guide active. I am here to review your project plans. How can I optimize your current project structures?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `
        You are the "AI Blueprint Guide" for Life Blueprinted. 
        You have access to a high-precision knowledge base of structural blueprints.
        
        CONTEXT:
        Blueprints: ${JSON.stringify(kb?.blueprints || [])}
        Timelines: ${JSON.stringify(kb?.timelines || [])}
        Tasks: ${JSON.stringify(kb?.tasks || [])}

        Guidelines:
        1. Maintain a high-precision, strategic, and professional architectural tone.
        2. Use structural language (foundation, project progress, component modules, integrity).
        3. Use Markdown for structured advice.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.concat({ role: 'user', text: userMessage }).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: { systemInstruction, temperature: 0.7 }
      });
      const aiText = response.text || "Structural error. Could not process project plan.";
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (err) {
      console.error('Gemini API Error:', err);
      setMessages(prev => [...prev, { role: 'model', text: "Signal lost. Recalibrating project data..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
      <div className="bg-[#0f172a] p-6 text-white flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#06b6d4] rounded-xl flex items-center justify-center shadow-lg shadow-[#06b6d4]/20">
            <Sparkles size={20} className="text-[#0f172a]" />
          </div>
          <div>
            <h2 className="font-black text-lg tracking-tight">Design Studio</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">AI Blueprint Review v5.2</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-[#06b6d4]/10 text-[#06b6d4]' : 'bg-[#0f172a] text-white'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${m.role === 'user' ? 'bg-[#06b6d4] text-[#0f172a] font-medium' : 'bg-white text-[#0f172a] border border-slate-100'}`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 bg-white p-4 rounded-2xl border border-slate-100 items-center shadow-sm">
              <Loader2 size={16} className="animate-spin text-[#06b6d4]" />
              <span className="text-xs text-slate-400 font-black uppercase tracking-widest italic">Calculating Project Path...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Review current project with AI Blueprint Guide..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-6 pr-16 focus:ring-2 focus:ring-[#06b6d4]/30 outline-none shadow-sm transition-all font-medium text-sm text-[#0f172a]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#0f172a] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            <Send size={20} className="text-[#06b6d4]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantChat;
