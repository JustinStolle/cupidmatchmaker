export function buildMockReply(characterId: string, message: string) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
        return "You seem thoughtful already. Go on.";
    }

    if (characterId === "julie") {
        return `There’s something intriguing about what you said: "${trimmedMessage}" Tell me more.`;
    }

    if (characterId === "jack") {
        return `I like that. "${trimmedMessage}" feels like a pretty good way to start getting to know somebody.`;
    }

    return `Thanks for saying "${trimmedMessage}".`;
}