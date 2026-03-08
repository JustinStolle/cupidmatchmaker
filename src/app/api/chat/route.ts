import { NextRequest, NextResponse } from "next/server";
import { getCharacter } from "@/lib/getCharacter";
import { generateCharacterReply } from "@/lib/bedrock";

type ChatRequestBody = {
    characterId?: string;
    message?: string;
};

export async function POST(request: NextRequest) {
    let body: ChatRequestBody;

    try {
        body = (await request.json()) as ChatRequestBody;
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body." },
            { status: 400 }
        );
    }

    const characterId = body.characterId?.trim();
    const message = body.message?.trim();

    if (!characterId) {
        return NextResponse.json(
            { error: "characterId is required." },
            { status: 400 }
        );
    }

    if (!message) {
        return NextResponse.json(
            { error: "message is required." },
            { status: 400 }
        );
    }

    const character = getCharacter(characterId);

    if (!character) {
        return NextResponse.json(
            { error: "Character not found." },
            { status: 404 }
        );
    }

    try {
        const reply = await generateCharacterReply(character.id, message);

        return NextResponse.json({ reply });
    } catch (error) {
        console.error("Bedrock chat error:", error);

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