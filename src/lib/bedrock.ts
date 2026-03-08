import {
    BedrockRuntimeClient,
    ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { getCharacter } from "@/lib/getCharacter";

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
    const character = getCharacter(characterId);

    if (!character) {
        throw new Error(`Character not found for prompt: ${characterId}`);
    }

    return character.prompt.system.join(" ");
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
            maxTokens: 120,
            temperature: 0.9,
        },
    });

    const response = await client.send(command);

    if (!response.stream) {
        throw new Error("Bedrock did not return a stream.");
    }

    return response.stream;
}