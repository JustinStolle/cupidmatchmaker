import {
    BedrockRuntimeClient,
    ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

type ChatMessage = {
    role?: "user" | "assistant";
    text?: string;
};

const region = process.env.BEDROCK_REGION;
const modelId = process.env.BEDROCK_MODEL_ID;

if (!region) {
    throw new Error("BEDROCK_REGION environment variable is not set.");
}

if (!modelId) {
    throw new Error("BEDROCK_MODEL_ID environment variable is not set.");
}

const client = new BedrockRuntimeClient({
    region,
});

function getSystemPrompt(characterId: string) {
    if (characterId === "julie") {
        return [
            "You are Julie Romanov, chatting through an early-2000s online dating portal.",
            "Stay fully in character.",
            "Do not say you are an AI assistant.",
            "Be warm, intelligent, thoughtful, slightly mysterious, and emotionally perceptive.",
            "Keep responses conversational and fairly concise.",
            "Do not reveal major hidden backstory too quickly.",
            "Sound human, natural, and emotionally present.",
        ].join(" ");
    }

    if (characterId === "jack") {
        return [
            "You are Jack Livingstone, chatting through an early-2000s online dating portal under the screen name Chip Man.",
            "Stay fully in character.",
            "Do not say you are an AI assistant.",
            "Be sincere, earnest, open, friendly, and likable.",
            "Keep responses conversational and fairly concise.",
            "Sound natural and genuinely interested in the other person.",
        ].join(" ");
    }

    return [
        "You are a fictional character in an early-2000s online dating portal.",
        "Stay in character and keep responses concise.",
    ].join(" ");
}

function buildConversationHistory(history: ChatMessage[], latestUserMessage: string) {
    const recentHistory = history
        .filter(
            (message) =>
                (message.role === "user" || message.role === "assistant") &&
                typeof message.text === "string" &&
                message.text.trim().length > 0
        )
        .slice(-10)
        .map((message) => ({
            role: message.role as "user" | "assistant",
            content: [
                {
                    text: message.text!.trim(),
                },
            ],
        }));

    recentHistory.push({
        role: "user",
        content: [
            {
                text: latestUserMessage,
            },
        ],
    });

    return recentHistory;
}

export async function generateCharacterReplyStream(
    characterId: string,
    userMessage: string,
    history: ChatMessage[] = []
) {
    const systemPrompt = getSystemPrompt(characterId);
    const messages = buildConversationHistory(history, userMessage);

    const command = new ConverseStreamCommand({
        modelId,
        system: [
            {
                text: systemPrompt,
            },
        ],
        messages,
        inferenceConfig: {
            maxTokens: 300,
            temperature: 0.9,
        },
    });

    const response = await client.send(command);

    if (!response.stream) {
        throw new Error("Bedrock did not return a stream.");
    }

    return response.stream;
}