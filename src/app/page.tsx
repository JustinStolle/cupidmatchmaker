import Link from "next/link";
import { getAllCharacters } from "@/lib/getCharacter";

export default function HomePage() {
    const characters = getAllCharacters();

    return (
        <main className="min-h-screen bg-gradient-to-b from-pink-100 via-sky-100 to-blue-200 text-slate-900">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <header className="mb-10 rounded-3xl border-4 border-white bg-white/80 p-8 shadow-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.3em] text-pink-600">
                                Welcome to
                            </p>
                            <h1 className="text-5xl font-black tracking-tight text-pink-700">
                                CupidMatchmaker.net
                            </h1>
                            <p className="mt-3 max-w-2xl text-lg text-slate-700">
                                The internet’s sweetest place to meet new people, make magical
                                connections, and start chatting instantly.
                            </p>
                        </div>

                        <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 px-4 py-3 text-sm shadow">
                            <div className="font-bold text-pink-700">Member Login</div>
                            <div className="text-slate-600">
                                Reimagined for a retro chat experience
                            </div>
                        </div>
                    </div>
                </header>

                <section className="mb-8 grid gap-6 md:grid-cols-2">
                    {characters.map((character) => (
                        <article
                            key={character.id}
                            className="rounded-3xl border-4 border-white bg-white/85 p-6 shadow-xl"
                        >
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-sky-700">
                                        {character.name}
                                    </h2>
                                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pink-600">
                                        {character.alias}
                                    </p>
                                </div>

                                <span className="rounded-full border border-green-300 bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                    {character.status}
                                </span>
                            </div>

                            <div className="mb-4 rounded-2xl border-2 border-sky-100 bg-sky-50 p-4 text-slate-700">
                                {character.description}
                            </div>

                            <Link
                                href={`/chat/${character.id}`}
                                className="inline-block rounded-2xl border-2 border-pink-300 bg-pink-500 px-5 py-3 font-bold text-white shadow transition hover:scale-[1.02] hover:bg-pink-600"
                            >
                                Start Chat
                            </Link>
                        </article>
                    ))}
                </section>

                <section className="rounded-3xl border-4 border-white bg-white/80 p-6 shadow-xl">
                    <h3 className="text-2xl font-extrabold text-pink-700">
                        Why Join CupidMatchmaker?
                    </h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl bg-pink-50 p-4">
                            <div className="font-bold text-pink-700">Instant Messaging</div>
                            <p className="mt-1 text-sm text-slate-700">
                                Real-time romantic conversation in a nostalgic portal-style
                                interface.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-sky-50 p-4">
                            <div className="font-bold text-sky-700">Curated Matches</div>
                            <p className="mt-1 text-sm text-slate-700">
                                Meet memorable personalities with distinct voices and stories.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-yellow-50 p-4">
                            <div className="font-bold text-yellow-700">True Connection</div>
                            <p className="mt-1 text-sm text-slate-700">
                                Talk, flirt, wonder, and discover what happens next.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}