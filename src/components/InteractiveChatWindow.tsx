"use client";

import { FormEvent, useMemo, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
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
      },
    ],
    [intro]
  );

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  async function sendMessage(text: string) {
    const trimmed = text.trim();

    if (!trimmed || isReplying) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
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
        }),
      });

      const data = (await response.json()) as ChatApiResponse;

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.reply || "I’m not sure what to say yet.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text:
          error instanceof Error
            ? `Sorry, something went wrong: ${error.message}`
            : "Sorry, something went wrong.",
      };

      setMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsReplying(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(inputValue);
  }

  function handleStarterQuestionClick(question: string) {
    void sendMessage(question);
  }

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

      <div className="space-y-4 p-6">
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
                {message.text}
              </div>
            </div>
          );
        })}

        {isReplying ? (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-sky-100 px-4 py-3 text-slate-500 shadow">
              typing...
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t bg-slate-50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Type your message..."
            disabled={isReplying}
            className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 focus:border-pink-400 disabled:bg-slate-100"
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