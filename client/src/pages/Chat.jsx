import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { toMediaUrl } from '../utils/mediaUrl';

// ─── Per-user localStorage helpers ───────────────────────────────────────────
const getStorageKey = (user) => {
    const email = user?.email ? String(user.email).trim().toLowerCase() : '';
    return email ? `scomm_chat_history_${email}` : 'scomm_chat_history_guest';
};

const persistHistory = (key, list) => {
    try {
        localStorage.setItem(key, JSON.stringify(list.slice(-40)));
    } catch {}
};

// ─── Product card — clickable link to product page ────────────────────────────
function ProductCard({ product }) {
    return (
        <Link
            to={`/product/${product.id || product._id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-accent-mint/50 hover:bg-white hover:shadow-sm transition-all group"
        >
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                {product.image ? (
                    <img
                        src={toMediaUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-accent-mint transition-colors">
                    {product.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{product.brand} · {product.category}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-accent-mint">
                        ${Number(product.price).toFixed(2)}
                    </span>
                    {product.rating && (
                        <span className="text-xs text-slate-400">
                            ⭐ {Number(product.rating).toFixed(1)}
                        </span>
                    )}
                    {product.countInStock === 0 && (
                        <span className="text-xs text-red-400 font-medium">Out of stock</span>
                    )}
                </div>
            </div>
            <span className="text-slate-300 group-hover:text-accent-mint transition-colors flex-shrink-0 text-xs font-bold">
                View →
            </span>
        </Link>
    );
}

// ─── Checkout card shown after order is created ───────────────────────────────
function CheckoutCard({ checkoutUrl }) {
    return (
        <div className="mt-1 p-4 rounded-xl bg-gradient-to-br from-accent-violet/10 to-accent-mint/10 border border-accent-mint/30 max-w-sm">
            <p className="text-sm font-semibold text-slate-700 mb-1">✅ Order created!</p>
            <p className="text-xs text-slate-500 mb-3">
                Complete your payment securely via Stripe. Your order is reserved for 30 minutes.
            </p>
            <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-violet to-accent-mint text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
            >
                💳 Pay Now →
            </a>
        </div>
    );
}

// ─── Text formatter — handles **bold**, newlines, and bare URLs ───────────────
function FormattedText({ text }) {
    const renderSegment = (segment, key) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const chunks = segment.split(urlRegex);
        return chunks.map((chunk, idx) =>
            /^https?:\/\//.test(chunk) ? (
                <a
                    key={`${key}-url-${idx}`}
                    href={chunk}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-accent-violet break-all"
                >
                    {chunk}
                </a>
            ) : (
                <span key={`${key}-txt-${idx}`}>{chunk}</span>
            )
        );
    };

    return (
        <>
            {text.split('\n').map((line, i, arr) => (
                <span key={i}>
                    {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                        part.startsWith('**') && part.endsWith('**') ? (
                            <strong key={j} className="font-semibold text-slate-900">
                                {part.slice(2, -2)}
                            </strong>
                        ) : (
                            <span key={j}>{renderSegment(part, `${i}-${j}`)}</span>
                        )
                    )}
                    {i < arr.length - 1 && <br />}
                </span>
            ))}
        </>
    );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                isUser
                    ? 'bg-accent-violet/15 text-accent-violet'
                    : 'bg-accent-mint/15 text-accent-mint'
            }`}>
                {isUser ? '👤' : '◈'}
            </div>

            <div className={`flex flex-col gap-2 max-w-[82%] ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Text bubble */}
                {msg.content && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isUser
                            ? 'bg-accent-violet/10 border border-accent-violet/20 text-slate-800 rounded-tr-sm'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                    }`}>
                        <FormattedText text={msg.content} />
                    </div>
                )}

                {/* Product cards */}
                {msg.products?.length > 0 && (
                    <div className="flex flex-col gap-2 w-full max-w-sm">
                        <p className="text-[11px] text-slate-400 px-1 font-medium">
                            {msg.products.length} product{msg.products.length > 1 ? 's' : ''} from SCOMM Store:
                        </p>
                        {msg.products.map((p) => (
                            <ProductCard key={p.id || p._id} product={p} />
                        ))}
                    </div>
                )}

                {/* Checkout card */}
                {msg.checkoutUrl && <CheckoutCard checkoutUrl={msg.checkoutUrl} />}

                {/* Timestamp */}
                {msg.timestamp && (
                    <span className="text-[10px] text-slate-400 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm bg-accent-mint/15 text-accent-mint font-bold">
                ◈
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
    'What electronics do you have under $300?',
    'Recommend a gift for a fitness lover',
    'Show me your best rated products',
    'Track my latest order',
    'Compare headphones for me',
    'What beauty products do you carry?',
];

// ─── Welcome message ──────────────────────────────────────────────────────────
const buildWelcome = (user) => ({
    role: 'assistant',
    content: `Hey${user ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm your SCOMM shopping assistant.\n\nI can help you:\n- 🔍 Find and compare products\n- 📦 Track your orders\n- 🛒 Place orders for you\n\nWhat are you looking for today?`,
    timestamp: Date.now(),
});

// ─── Main Chat page ───────────────────────────────────────────────────────────
export default function Chat() {
    const { user } = useAuth();
    const bottomRef = useRef();
    const inputRef = useRef();
    const storageKey = getStorageKey(user);

    const [messages, setMessages] = useState([buildWelcome(user)]);
    const [isStorageReady, setIsStorageReady] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Load per-user history when user/storageKey changes
    useEffect(() => {
        setIsStorageReady(false);
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                    setIsStorageReady(true);
                    return;
                }
            }
        } catch {}
        const welcome = [buildWelcome(user)];
        setMessages(welcome);
        persistHistory(storageKey, welcome);
        setIsStorageReady(true);
    }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist whenever messages change
    useEffect(() => {
        if (!isStorageReady) return;
        persistHistory(storageKey, messages);
    }, [messages, storageKey, isStorageReady]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const clearHistory = () => {
        localStorage.removeItem(storageKey);
        const welcome = [buildWelcome(user)];
        setMessages(welcome);
        persistHistory(storageKey, welcome);
    };

    const sendMessage = async (text) => {
        const userText = (text || input).trim();
        if (!userText || loading || !user) return;
        setInput('');

        const userMsg = { role: 'user', content: userText, timestamp: Date.now() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            const { data } = await api.post('/chat', {
                messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            });

            const { message, products, checkoutUrl } = data.payload;
            const assistantMsg = {
                role: 'assistant',
                content: message,
                products: products || [],
                checkoutUrl: checkoutUrl || null,
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Something went wrong';
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `Sorry, something went wrong: ${errMsg}. Please try again.`,
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const isFirstMessage = messages.length === 1 && messages[0].role === 'assistant';

    return (
        <div
            className="max-w-3xl mx-auto px-4 py-8 flex flex-col"
            style={{ height: 'calc(100vh - 4rem)' }}
        >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-accent-mint mb-1">
                        AI Assistant
                    </p>
                    <h1 className="text-2xl font-display font-bold text-slate-900">SCOMM Chat</h1>
                </div>
                <div className="flex items-center gap-3">
                    {messages.length > 1 && (
                        <button
                            type="button"
                            onClick={clearHistory}
                            className="text-xs text-slate-400 hover:text-red-400 transition-colors border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-lg"
                        >
                            Clear chat
                        </button>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
                        Powered by Groq
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4 min-h-0">
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <MessageBubble key={i} msg={msg} />
                    ))}
                </AnimatePresence>
                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
            </div>

            {/* Suggestion chips */}
            {isFirstMessage && !loading && user && (
                <div className="flex-shrink-0 flex flex-wrap gap-2 mb-3">
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => sendMessage(s)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-accent-mint/40 hover:bg-slate-50 transition-all"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Guest notice */}
            {!user && (
                <div className="flex-shrink-0 mb-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>
                        <Link to="/login" className="underline hover:text-amber-900 font-medium">
                            Sign in
                        </Link>{' '}
                        to use AI chat. Messages are disabled for guests.
                    </span>
                </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0 flex gap-3 items-end">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder={
                        user
                            ? 'Ask me anything — products, orders, recommendations…'
                            : 'Sign in to use AI chat'
                    }
                    rows={1}
                    disabled={loading || !user}
                    className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-accent-mint/50 focus:ring-2 focus:ring-accent-mint/10 resize-none transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '48px', maxHeight: '140px' }}
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                    }}
                />
                <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading || !user}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-r from-accent-violet to-accent-mint text-white font-bold text-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 flex-shrink-0 shadow-sm"
                >
                    {loading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        '↑'
                    )}
                </button>
            </div>
        </div>
    );
}
