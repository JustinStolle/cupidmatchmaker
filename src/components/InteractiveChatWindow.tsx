"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    timing: {
        baseDelayMs: number;
        mediumMessageDelayMs: number;
        longMessageDelayMs: number;
        typingSpeedMs: number;
        punctuationPauseMs: number;
    };
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

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMessageLengthDelay(
    message: string,
    timing: {
        mediumMessageDelayMs: number;
        longMessageDelayMs: number;
    }
) {
    const trimmed = message.trim();

    if (trimmed.length < 40) {
        return 0;
    }

    if (trimmed.length < 120) {
        return timing.mediumMessageDelayMs;
    }

    return timing.longMessageDelayMs;
}

function getHumanLikeInitialDelay(
    message: string,
    timing: {
        baseDelayMs: number;
        mediumMessageDelayMs: number;
        longMessageDelayMs: number;
    }
) {
    return timing.baseDelayMs + getMessageLengthDelay(message, timing);
}

async function delayForCharacter(char: string, timing: InteractiveChatWindowProps["timing"]) {
    const baseDelay = timing.typingSpeedMs;

    if (char === "." || char === "!" || char === "?" || char === ",") {
        await delay(baseDelay + timing.punctuationPauseMs);
        return;
    }

    await delay(baseDelay);
}

function createUserMessage(text: string): Message {
    return {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        timestamp: new Date().toISOString(),
    };
}

function createStreamingAssistantMessage(): Message {
    return {
        id: `assistant-stream-${Date.now()}`,
        role: "assistant",
        text: "",
        timestamp: new Date().toISOString(),
    };
}

async function readStreamedResponse(response: Response): Promise<string> {
    if (!response.body) {
        throw new Error("Streaming response body was missing.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        fullText += decoder.decode(value, { stream: true });
    }

    fullText += decoder.decode();

    return fullText;
}

function isStreamingAssistantMessage(message: Message) {
    return message.id.startsWith("assistant-stream-");
}

function isEmptyStreamingAssistantMessage(message: Message) {
    return isStreamingAssistantMessage(message) && !message.text;
}

function getTypingIndicatorText(characterName: string) {
    return `${characterName} is typing…`;
}

export function InteractiveChatWindow({
    characterId,
    characterName,
    characterAlias,
    intro,
    starterQuestions = [],
    timing,
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
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const isReplyingRef = useRef(false);

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
        if (!hasLoadedStoredMessages) {
            return;
        }

        requestAnimationFrame(() => {
            focusTextarea();
        });
    }, [hasLoadedStoredMessages]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [inputValue]);

    function replaceStreamingMessage(
        streamingAssistantId: string,
        text: string
    ) {
        setMessages((current) =>
            current.map((message) =>
                message.id === streamingAssistantId
                    ? {
                        ...message,
                        id: `assistant-${Date.now()}`,
                        text: text || "I’m not sure what to say yet.",
                        timestamp: new Date().toISOString(),
                    }
                    : message
            )
        );
    }

    function replaceStreamingMessageWithError(
        streamingAssistantId: string,
        error: unknown
    ) {
        setMessages((current) =>
            current.map((message) =>
                message.id === streamingAssistantId
                    ? {
                        ...message,
                        id: `assistant-error-${Date.now()}`,
                        text:
                            error instanceof Error
                                ? `Sorry, something went wrong: ${error.message}`
                                : "Sorry, something went wrong.",
                        timestamp: new Date().toISOString(),
                    }
                    : message
            )
        );
    }

    function updateStreamingMessage(streamingAssistantId: string, text: string) {
        setMessages((current) => {
            const index = current.findIndex((m) => m.id === streamingAssistantId);

            if (index === -1) return current;

            const updated = [...current];
            updated[index] = { ...updated[index], text };

            return updated;
        });
    }

    async function sendMessage(text: string) {
        const trimmed = text.trim();

        if (!trimmed || isReplyingRef.current) {
            return;
        }

        isReplyingRef.current = true;

        const userMessage = createUserMessage(trimmed);
        const streamingAssistantMessage = createStreamingAssistantMessage();
        const streamingAssistantId = streamingAssistantMessage.id;

        const nextMessages = [...messages, userMessage, streamingAssistantMessage];

        const history = messages.map((message) => ({
            role: message.role,
            text: message.text,
        }));

        setMessages(nextMessages);
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

            const initialDelay = getHumanLikeInitialDelay(trimmed, timing);
            await delay(initialDelay);

            const fullText = await readStreamedResponse(response);

            let renderedText = "";

            while (renderedText.length < fullText.length) {
                renderedText += fullText[renderedText.length];

                if (renderedText.length % 3 === 0) {
                    updateStreamingMessage(streamingAssistantId, renderedText);
                }

                await delayForCharacter(renderedText[renderedText.length - 1], timing);
            }

            replaceStreamingMessage(streamingAssistantId, renderedText);
        } catch (error) {
            replaceStreamingMessageWithError(streamingAssistantId, error);
        } finally {
            isReplyingRef.current = false;
            setIsReplying(false);

            requestAnimationFrame(() => {
                focusTextarea();
            });
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void sendMessage(inputValue);
        }
    }

    function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        void sendMessage(inputValue);
    }

    function handleStarterQuestionClick(question: string, event: React.MouseEvent<HTMLButtonElement>) {
        event.currentTarget.blur();

        void sendMessage(question);

        requestAnimationFrame(() => {
            focusTextarea();
        });
    }

    function handleClearConversation() {
        const storageKey = getStorageKey(characterId);
        window.localStorage.removeItem(storageKey);
        setMessages(initialMessages);
        setInputValue("");
        setIsReplying(false);

        requestAnimationFrame(() => {
            focusTextarea();
        });
    }

    function focusTextarea() {
        textareaRef.current?.focus();
    }

    if (!hasLoadedStoredMessages) {
        return (
            <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl">
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
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl">
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
                        disabled={isReplying}
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
                                onClick={(event) => handleStarterQuestionClick(question, event)}
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
                                className={`max-w-[75%] rounded-2xl px-4 py-3 shadow ${isUser
                                    ? "rounded-tr-sm bg-pink-100 text-slate-800"
                                    : isEmptyStreamingAssistantMessage(message)
                                        ? "rounded-tl-sm bg-sky-50 text-slate-500 italic"
                                        : "rounded-tl-sm bg-sky-100 text-slate-800"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">
                                    {message.text || (isEmptyStreamingAssistantMessage(message) ? getTypingIndicatorText(characterName) : "")}
                                </div>
                                {!isStreamingAssistantMessage(message) && (
                                    <div className="mt-2 text-right text-xs text-slate-500">
                                        {formatTime(message.timestamp)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

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