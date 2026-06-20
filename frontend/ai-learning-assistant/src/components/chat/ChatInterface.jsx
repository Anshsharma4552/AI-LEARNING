import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';

import aiService from '../../service/aiService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/spinner';
import MarkdownRenderer from '../common/MarkdownRenderer';

const ChatInterface = () => {
    const { id: documentId } = useParams();
    const { user } = useAuth();

    const [history, setHistory] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!documentId) {
                setInitialLoading(false);
                return;
            }
    
            try {
                setInitialLoading(true);
    
                const localHistory = localStorage.getItem(chatStorageKey);
    
                if (localHistory) {
                    setHistory(JSON.parse(localHistory));
                } else {
                    const response = await aiService.getChatHistory(documentId);
                    setHistory(response?.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
                setHistory([]);
            } finally {
                setInitialLoading(false);
            }
        };
    
        fetchChatHistory();
    }, [documentId]);

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!message.trim() || !documentId) return;

        const userMessage = {
            role: 'user',
            content: message,
            timestamp: new Date(),
        };

        setHistory((prev) => [...prev, userMessage]);
        setMessage('');
        setLoading(true);

        try {
            const response = await aiService.chat(
                documentId,
                userMessage.content
            );

            console.log("CHAT RESPONSE:", response);

            const assistantMessage = {
                role: 'assistant',
                content: response?.data?.answer ||  "No answer received",
                timestamp: new Date(),
                relevantChunks: response?.data?.relevantChunks || [],
            };

            setHistory((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);

            const errorMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };

            setHistory((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (msg, index) => {
        const isUser = msg.role === 'user';

        return (
            <div
                key={index}
                className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
                <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                        isUser
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-800'
                    }`}
                >
                    {isUser ? (
                        <p>{msg.content}</p>
                    ) : (
                        <MarkdownRenderer content={msg.content} />
                    )}
                </div>
                {isUser && (
                    <div className=''>
                        {user?.username?.charAt(0).toUpperCase()||'U'}
                    </div>
                )}
            </div>
        );
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl items-center justify-center shadow-xl shadow-slate-200/50">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
                    <MessageSquare
                        className="w-7 h-7 text-emerald-600"
                        strokeWidth={2}
                    />
                </div>

                <Spinner />

                <p className="text-sm text-slate-500 mt-3 font-medium">
                    Loading chat history...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200/70">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>

                <div>
                    <h2 className="font-semibold text-slate-800">AI Chat</h2>
                    <p className="text-xs text-slate-500">
                        Ask questions about this document
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">
                            Start chatting with your document.
                        </p>
                    </div>
                ) : (
                    history.map((msg, index) => renderMessage(msg, index))
                )}

                {loading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-slate-100 text-slate-600 px-4 py-3 rounded-2xl text-sm">
                            Thinking...
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-3 p-4 border-t border-slate-200/70"
            >
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    disabled={loading || !documentId}
                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                />

                <button
                    type="submit"
                    disabled={loading || !message.trim() || !documentId}
                    className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;