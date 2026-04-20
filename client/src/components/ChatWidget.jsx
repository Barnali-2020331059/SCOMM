import { useState } from 'react';
import { Link } from 'react-router-dom';
import { chatProducts } from '../api';

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            answer: 'Tell me what you want to buy, and I will suggest products available in this store.',
            products: [],
        },
    ]);

    const handleSend = async (e) => {
        e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed || loading) return;
        setMessages((prev) => [...prev, { role: 'user', answer: trimmed, products: [] }]);
        setMessage('');
        setLoading(true);
        try {
            const result = await chatProducts(trimmed);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    answer: result.answer || 'Here are some product suggestions from our catalog.',
                    products: Array.isArray(result.products) ? result.products : [],
                },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    answer: err.response?.data?.message || 'Could not process your request right now.',
                    products: [],
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70]">
            {open && (
                <div className="w-[calc(100vw-2rem)] max-w-[390px] h-[70vh] max-h-[540px] mb-4 rounded-3xl border border-accent-violet/40 bg-white shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-teal-50">
                        <h3 className="font-semibold text-slate-800">AI Shopping Assistant</h3>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-slate-500 hover:text-slate-900"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {messages.map((m, idx) => (
                            <div key={`${m.role}-${idx}`}>
                                <div
                                    className={`text-sm px-3 py-2 rounded-xl ${
                                        m.role === 'user'
                                            ? 'bg-indigo-600 text-white ml-8'
                                            : 'bg-slate-100 text-slate-800 mr-8 border border-slate-200'
                                    }`}
                                >
                                    {m.answer}
                                </div>
                                {m.role === 'assistant' && m.products.length > 0 && (
                                    <div className="mt-2 space-y-2 mr-8">
                                        {m.products.map((p) => (
                                            <Link
                                                key={p._id}
                                                to={p.link}
                                                className="block rounded-lg border border-slate-200 bg-white p-2 hover:bg-indigo-50 transition-colors"
                                                onClick={() => setOpen(false)}
                                            >
                                                <p className="text-sm text-slate-900 font-medium line-clamp-1">{p.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {p.category} · ${Number(p.price || 0).toFixed(2)}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSend} className="p-3 border-t border-slate-200 flex gap-2 bg-slate-50">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="I want lightweight running shoes..."
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
                        >
                            {loading ? '...' : 'Send'}
                        </button>
                    </form>
                </div>
            )}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-indigo-600 to-teal-500 text-white font-bold shadow-2xl ring-4 ring-indigo-200 animate-pulse"
                aria-label="Open shopping assistant"
            >
                AI
            </button>
        </div>
    );
}
