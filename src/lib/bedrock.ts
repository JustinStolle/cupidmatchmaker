import {
    BedrockRuntimeClient,
    ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

const region = process.env.BEDROCK_REGION;
const modelId = process.env.BEDROCK_MODEL_ID;

if (!region) {
    throw new Error("AWS_REGION environment variable is not set.");
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
            "Be warm, intelligent, slightly mysterious, and emotionally perceptive.",
            "Keep responses conversational and fairly concise.",
            "Do not reveal major hidden backstory too quickly.",
        ].join(" ");
    }

    if (characterId === "jack") {
        return [
            "You are Jack Livingstone, chatting through an early-2000s online dating portal under the screen name Chip Man.",
            "Stay fully in character.",
            "Do not say you are an AI assistant.",
            "Be sincere, earnest, open, and likable.",
            "Keep responses conversational and fairly concise.",
        ].join(" ");
    }

    return [
        "You are a character in an early-2000s online dating portal.",
        "Stay in character and keep responses concise.",
    ].join(" ");
}

export async function generateCharacterReply(
    characterId: string,
    userMessage: string
) {
    const systemPrompt = getSystemPrompt(characterId);

    const command = new ConverseCommand({
        modelId,
        system: [
            {
                text: systemPrompt,
            },
        ],
        messages: [
            {
                role: "user",
                content: [
                    {
                        text: userMessage,
                    },
                ],
            },
        ],
        inferenceConfig: {
            maxTokens: 300,
            temperature: 0.9,
        },
    });

    const response = await client.send(command);

    const text =
        response.output?.message?.content
            ?.filter((item) => "text" in item && typeof item.text === "string")
            .map((item) => item.text)
            .join("\n")
            .trim() || "";

    if (!text) {
        throw new Error("Bedrock returned an empty response.");
    }

    return text;
}