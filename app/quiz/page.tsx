'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Only keep last 5 Q&A pairs = 10 messages sent to API
const MAX_PAIRS = 5;

function trimHistory(messages: Message[]): Message[] {
  const maxMessages = MAX_PAIRS * 2;
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [vp, setVp] = useState<{ height: number; top: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const sendToApi = useCallback(async (msgs: Message[]) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Only send last 5 Q&A pairs to the API
        body: JSON.stringify({ messages: trimHistory(msgs) }),
      });

      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }

      setQuestionCount((n) => n + 1);
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, []);

  const startQuiz = useCallback(async () => {
    setStarted(true);
    const kickoff: Message[] = [{ role: 'user', content: 'Start the quiz. Ask me the first question.' }];
    setMessages(kickoff);
    await sendToApi(kickoff);
  }, [sendToApi]);

  const sendAnswer = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    await sendToApi(nextMessages);
  }, [input, loading, messages, sendToApi]);

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
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Quiz Mode</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {questionCount > 0 ? `${questionCount} question${questionCount !== 1 ? 's' : ''} so far` : 'Management Grundlagen'}
          </span>
        </div>
        <Link
          href="/"
          className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
        >
          ← Chat
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
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">Quiz yourself</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 max-w-xs">
                One question at a time. No mercy. Endless.
              </p>
            </div>
            <button
              onClick={startQuiz}
              className="mt-2 px-6 py-3 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-80 active:scale-95 transition-all"
            >
              Start Quiz
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 pt-4 pb-6 max-w-3xl mx-auto w-full">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              // Hide the kickoff message
              if (i === 0 && msg.content === 'Start the quiz. Ask me the first question.') return null;

              return (
                <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {msg.content === '' && loading && i === messages.length - 1 ? (
                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                      <TypingDots />
                    </div>
                  ) : (
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
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* Input — only shown after quiz started */}
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
              placeholder="Your answer..."
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
            Enter to submit · Shift+Enter for new line
          </p>
        </footer>
      )}
    </div>
  );
}
