import { InteractiveChatWindow } from "@/components/InteractiveChatWindow";
import { getCharacter } from "@/lib/getCharacter";

type ChatPageProps = {
    params: Promise<{
        characterId: string;
    }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
    const { characterId } = await params;
    const character = getCharacter(characterId);

    if (!character) {
        return (
            <main className="min-h-screen bg-slate-100 p-10">
                <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
                    <h1 className="text-3xl font-bold text-red-600">Character not found</h1>
                    <p className="mt-2 text-slate-700">
                        That profile does not exist yet.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-pink-100 p-6">
            <InteractiveChatWindow
                characterId={character.id}
                characterName={character.name}
                characterAlias={character.alias}
                intro={character.intro}
                starterQuestions={character.starterQuestions}
                timing={character.timing}
            />
        </main>
    );
}