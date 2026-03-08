"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Message = {
    id: string;
    role: "user" | "assistant";
    text: string;
    timestamp: string;
};

type InteractiveChatWindowProps = {
    characterId: string;
    characterName: string;
    characterAlias: string;
    intro: string;
    starterQuestions?: string[];
};

type ChatApiResponse = {
    reply?: string;
    error?: string;
};

function getStorageKey(characterId: string) {
    return `cupidmatchmaker:chat:${characterId}`;
}

function formatTime(timestamp: string) {
    const date = new Date(timestamp);

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}

export function InteractiveChatWindow({
    characterId,
    characterName,
    characterAlias,
    intro,
    starterQuestions = [],
}: InteractiveChatWindowProps) {
    const initialMessages = useMemo<Message[]>(
        () => [
            {
                id: "intro-message",
                role: "assistant",
                text: intro,
                timestamp: new Date().toISOString(),
            },
        ],
        [intro]
    );

    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [inputValue, setInputValue] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [hasLoadedStoredMessages, setHasLoadedStoredMessages] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const storageKey = getStorageKey(characterId);
        const storedValue = window.localStorage.getItem(storageKey);

        if (!storedValue) {
            setMessages(initialMessages);
            setHasLoadedStoredMessages(true);
            return;
        }

        try {
            const parsed = JSON.parse(storedValue) as Message[];

            if (Array.isArray(parsed) && parsed.length > 0) {
                const validMessages = parsed
                    .filter(
                        (message) =>
                            message &&
                            typeof message.id === "string" &&
                            (message.role === "user" || message.role === "assistant") &&
                            typeof message.text === "string"
                    )
                    .map((message) => ({
                        ...message,
                        timestamp:
                            typeof message.timestamp === "string"
                                ? message.timestamp
                                : new Date().toISOString(),
                    }));

                if (validMessages.length > 0) {
                    setMessages(validMessages);
                } else {
                    setMessages(initialMessages);
                }
            } else {
                setMessages(initialMessages);
            }
        } catch {
            setMessages(initialMessages);
        }

        setHasLoadedStoredMessages(true);
    }, [characterId, initialMessages]);

    useEffect(() => {
        if (!hasLoadedStoredMessages) {
            return;
        }

        const storageKey = getStorageKey(characterId);
        window.localStorage.setItem(storageKey, JSON.stringify(messages));
    }, [characterId, hasLoadedStoredMessages, messages]);

    useEffect(() => {
        if (!hasLoadedStoredMessages) {
            return;
        }

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [hasLoadedStoredMessages, messages, isReplying]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [inputValue]);

    async function sendMessage(text: string) {
        const trimmed = text.trim();

        if (!trimmed || isReplying) {
            return;
        }

        const history = messages.map((message) => ({
            role: message.role,
            text: message.text,
        }));

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            text: trimmed,
            timestamp: new Date().toISOString(),
        };

        const streamingAssistantId = `assistant-stream-${Date.now()}`;

        const streamingAssistantMessage: Message = {
            id: streamingAssistantId,
            role: "assistant",
            text: "",
            timestamp: new Date().toISOString(),
        };

        setMessages((current) => [...current, userMessage, streamingAssistantMessage]);
        setInputValue("");
        setIsReplying(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    characterId,
                    message: trimmed,
                    history,
                }),
            });

            if (!response.ok) {
                const rawText = await response.text();
                let errorMessage = rawText || `Request failed with status ${response.status}.`;

                try {
                    const data = JSON.parse(rawText) as ChatApiResponse;
                    errorMessage = data.error || errorMessage;
                } catch {
                    // keep raw text
                }

                throw new Error(errorMessage);
            }

            if (!response.body) {
                throw new Error("Streaming response body was missing.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                accumulatedText += decoder.decode(value, { stream: true });

                setMessages((current) =>
                    current.map((message) =>
                        message.id === streamingAssistantId
                            ? {
                                ...message,
                                text: accumulatedText,
                            }
                            : message
                    )
                );
            }

            accumulatedText += decoder.decode();

            setMessages((current) =>
                current.map((message) =>
                    message.id === streamingAssistantId
                        ? {
                            ...message,
                            text: accumulatedText || "I’m not sure what to say yet.",
                        }
                        : message
                )
            );
        } catch (error) {
            setMessages((current) =>
                current.map((message) =>
                    message.id === streamingAssistantId
                        ? {
                            ...message,
                            text:
                                error instanceof Error
                                    ? `Sorry, something went wrong: ${error.message}`
                                    : "Sorry, something went wrong.",
                        }
                        : message
                )
            );
        } finally {
            setIsReplying(false);
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void sendMessage(inputValue);
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void sendMessage(inputValue);
    }

    function handleStarterQuestionClick(question: string) {
        void sendMessage(question);
    }

    function handleClearConversation() {
        const storageKey = getStorageKey(characterId);
        window.localStorage.removeItem(storageKey);
        setMessages(initialMessages);
        setInputValue("");
        setIsReplying(false);
    }

    if (!hasLoadedStoredMessages) {
        return (
            <div className="mx-auto max-w-4xl rounded-3xl border-4 border-white bg-white shadow-2xl">
                <div className="border-b bg-pink-500 px-6 py-4 text-white">
                    <div className="text-sm uppercase tracking-[0.2em] opacity-90">
                        CupidMatchmaker Chat
                    </div>
                    <h1 className="text-3xl font-extrabold">
                        {characterName} <span className="text-pink-100">({characterAlias})</span>
                    </h1>
                </div>

                <div className="p-6 text-slate-600">Loading conversation...</div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl rounded-3xl border-4 border-white bg-white shadow-2xl">
            <div className="border-b bg-pink-500 px-6 py-4 text-white">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-sm uppercase tracking-[0.2em] opacity-90">
                            CupidMatchmaker Chat
                        </div>
                        <h1 className="text-3xl font-extrabold">
                            {characterName} <span className="text-pink-100">({characterAlias})</span>
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={handleClearConversation}
                        className="rounded-xl border border-pink-200 bg-white/15 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/25"
                    >
                        Clear Chat
                    </button>
                </div>
            </div>

            {starterQuestions.length > 0 ? (
                <div className="border-b bg-pink-50 px-6 py-4">
                    <div className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-pink-700">
                        Icebreaker Questions
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {starterQuestions.map((question) => (
                            <button
                                key={question}
                                type="button"
                                onClick={() => handleStarterQuestionClick(question)}
                                disabled={isReplying}
                                className="rounded-full border border-pink-300 bg-white px-4 py-2 text-sm font-medium text-pink-700 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            ) : null}

            <div
                ref={messagesContainerRef}
                className="max-h-[60vh] space-y-4 overflow-y-auto p-6"
            >
                {messages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 text-slate-800 shadow ${isUser
                                    ? "rounded-tr-sm bg-pink-100"
                                    : "rounded-tl-sm bg-sky-100"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">
                                    {message.text || (message.id.includes("assistant-stream-") ? "typing..." : "")}
                                </div>
                                <div className="mt-2 text-right text-xs text-slate-500">
                                    {formatTime(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isReplying ? (
                    <div className="flex justify-start">
                        <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-sky-100 px-4 py-3 text-slate-500 shadow">
                            <div>typing...</div>
                            <div className="mt-2 text-right text-xs text-slate-400">
                                {formatTime(new Date().toISOString())}
                            </div>
                        </div>
                    </div>
                ) : null}

                <div ref={messagesEndRef} />
            </div>

            <div className="border-t bg-slate-50 p-4">
                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={isReplying}
                        rows={1}
                        className="flex-1 resize-none rounded-2xl border border-slate-400 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none ring-0 focus:border-pink-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isReplying}
                        className="rounded-2xl bg-pink-500 px-5 py-3 font-bold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}