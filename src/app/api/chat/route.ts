import { NextRequest, NextResponse } from "next/server";
import { getCharacter } from "@/lib/getCharacter";
import { buildMockReply } from "@/lib/generateCharacterReply";

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

    const reply = buildMockReply(character.id, message);

    return NextResponse.json({ reply });
}