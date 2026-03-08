import { NextRequest, NextResponse } from "next/server";
import { getCharacter } from "@/lib/getCharacter";
import { generateCharacterReplyStream } from "@/lib/bedrock";

type ChatMessage = {
    role?: "user" | "assistant";
    text?: string;
};

type ChatRequestBody = {
    characterId?: string;
    message?: string;
    history?: ChatMessage[];
};

export async function POST(request: NextRequest) {
    let body: ChatRequestBody;

    try {
        body = (await request.json()) as ChatRequestBody;
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const characterId = body.characterId?.trim();
    const message = body.message?.trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!characterId) {
        return NextResponse.json({ error: "characterId is required." }, { status: 400 });
    }

    if (!message) {
        return NextResponse.json({ error: "message is required." }, { status: 400 });
    }

    const character = getCharacter(characterId);

    if (!character) {
        return NextResponse.json({ error: "Character not found." }, { status: 404 });
    }

    try {
        const bedrockStream = await generateCharacterReplyStream(character.id, message, history);
        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of bedrockStream) {
                        const text =
                            chunk.contentBlockDelta?.delta?.text ??
                            "";

                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }

                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache, no-transform",
            },
        });
    } catch (error) {
        console.error("Bedrock streaming chat error:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate reply.",
            },
            { status: 500 }
        );
    }
}