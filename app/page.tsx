'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string;
}

const USAGE_MARKER = '\x00USAGE:';

function extractUsage(text: string): { clean: string; cents?: number } {
  const idx = text.indexOf(USAGE_MARKER);
  if (idx === -1) return { clean: text };
  const clean = text.slice(0, idx).replace(/\n$/, '');
  const cents = parseFloat(text.slice(idx + USAGE_MARKER.length));
  return { clean, cents: isNaN(cents) ? undefined : cents };
}

function pickRandom(bank: QuizQuestion[], asked: Set<string>): QuizQuestion {
  const available = bank.filter(q => !asked.has(q.id));
  const pool = available.length > 0 ? available : bank;
  return pool[Math.floor(Math.random() * pool.length)];
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export default function QuizPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [costs, setCosts] = useState<Record<number, number>>({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalCents, setTotalCents] = useState(0);

  const [quizBank, setQuizBank] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [askedIds, setAskedIds] = useState<Set<string>>(new Set());
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [vp, setVp] = useState<{ height: number; top: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const vv = window.visualViewport;
      setVp({ height: vv ? vv.height : window.innerHeight, top: vv ? vv.offsetTop : 0 });
    };
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const startQuiz = useCallback(async () => {
    setBankLoading(true);
    setBankError(null);
    try {
      const res = await fetch('/api/quiz-bank');
      const data = await res.json() as { questions?: QuizQuestion[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to load quiz bank');

      const bank = data.questions!;
      const firstQuestion = pickRandom(bank, new Set());

      setQuizBank(bank);
      setAskedIds(new Set([firstQuestion.id]));
      setCurrentQuestion(firstQuestion);
      setStarted(true);
      setQuestionCount(1);
      setMessages([{ role: 'assistant', content: firstQuestion.question }]);
    } catch (err) {
      setBankError(err instanceof Error ? err.message : 'Error loading quiz bank');
    } finally {
      setBankLoading(false);
    }
  }, []);

  const sendAnswer = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !currentQuestion) return;

    const userMsg: Message = { role: 'user', content: text };
    const messagesWithUser = [...messages, userMsg];
    setMessages(messagesWithUser);
    setInput('');
    setLoading(true);

    const assistantIdx = messagesWithUser.length;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/quiz-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          correctAnswer: currentQuestion.answer,
          userAnswer: text,
        }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value);
        const { clean, cents } = extractUsage(accumulated);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: clean };
          return updated;
        });
        if (cents !== undefined) {
          setCosts(prev => ({ ...prev, [assistantIdx]: cents }));
          setTotalCents(t => t + cents);
        }
      }

      // Pick next question locally — no API call
      const newAsked = new Set([...askedIds, currentQuestion.id]);
      const next = pickRandom(quizBank, newAsked);
      setAskedIds(new Set([...newAsked, next.id]));
      setCurrentQuestion(next);
      setQuestionCount(n => n + 1);
      setMessages(prev => [...prev, { role: 'assistant', content: next.question }]);

    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Fehler: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, currentQuestion, messages, quizBank, askedIds]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  return (
    <div
      className="flex flex-col bg-white dark:bg-zinc-950"
      style={{
        position: 'fixed',
        top: vp ? vp.top : 0,
        left: 0,
        right: 0,
        height: vp ? vp.height : '100dvh',
      }}
    >
      {/* Header */}
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Quiz</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {questionCount > 0
              ? `${questionCount}Q · ${totalCents.toFixed(2)}¢ gesamt`
              : 'Management Grundlagen'}
          </span>
        </div>
        <Link
          href="/chat"
          className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          Chat →
        </Link>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        {!started ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl">
              🎯
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">Quiz dich ab</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs">
                Eine Frage. Kein Erbarmen. Endlos.
              </p>
            </div>
            {bankError && (
              <p className="text-xs text-red-500 max-w-xs">{bankError}</p>
            )}
            <button
              onClick={startQuiz}
              disabled={bankLoading}
              className="mt-2 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all disabled:opacity-40"
            >
              {bankLoading ? 'Lade Quiz…' : 'Quiz starten'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 pt-4 pb-6 max-w-3xl mx-auto w-full">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {msg.content === '' && loading && i === messages.length - 1 ? (
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                      <TypingDots />
                    </div>
                  ) : (
                    <>
                      <div
                        className={`
                          max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words
                          ${isUser
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-br-sm'
                            : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm'
                          }
                        `}
                      >
                        {msg.content}
                      </div>
                      {!isUser && costs[i] !== undefined && (
                        <span className="mt-1 text-[10px] text-zinc-300 dark:text-zinc-600 px-1">
                          {costs[i].toFixed(3)}¢
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Input */}
      {started && (
        <footer
          className="flex-none border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
              placeholder="Deine Antwort…"
              rows={1}
              disabled={loading}
              className="
                flex-1 resize-none rounded-2xl border border-zinc-200 dark:border-zinc-700
                bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100
                placeholder-zinc-400 dark:placeholder-zinc-500
                px-4 py-3 text-base leading-relaxed outline-none
                focus:border-zinc-400 dark:focus:border-zinc-500
                disabled:opacity-50 transition-colors
              "
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={sendAnswer}
              disabled={!input.trim() || loading}
              className="
                flex-none w-10 h-10 rounded-full flex items-center justify-center
                bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:opacity-80 active:scale-95 transition-all
              "
            >
              <SendIcon />
            </button>
          </div>
          <p className="hidden sm:block text-center text-xs text-zinc-300 dark:text-zinc-600 mt-2 max-w-3xl mx-auto">
            Enter zum Absenden · Shift+Enter für neue Zeile
          </p>
        </footer>
      )}
    </div>
  );
}
