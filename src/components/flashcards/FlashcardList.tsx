import { useState, useEffect, useMemo } from "react";
import type { FlashcardDTO } from "../../types";

interface FlashcardListProps {
  userJson?: string | null;
}

interface User {
  email: string | undefined;
  id: string;
}

// Dummy flashcards for non-authenticated users
const DUMMY_FLASHCARDS: FlashcardDTO[] = [
  {
    id: 1,
    front: "Co to jest React?",
    back: "React to biblioteka JavaScript do budowania interfejsów użytkownika, stworzona przez Facebook.",
    source: "manual",
    generation_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    front: "Co to jest TypeScript?",
    back: "TypeScript to nadzbiór JavaScriptu dodający statyczne typowanie i inne funkcje do języka.",
    source: "ai-full",
    generation_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    front: "Czym jest Astro?",
    back: "Astro to nowoczesny framework do budowania szybkich stron internetowych z możliwością używania różnych frameworków UI.",
    source: "ai-edited",
    generation_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    front: "Co to jest Tailwind CSS?",
    back: "Tailwind CSS to utility-first CSS framework, który pozwala szybko budować interfejsy używając gotowych klas.",
    source: "manual",
    generation_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    front: "Czym jest Supabase?",
    back: "Supabase to open-source alternatywa dla Firebase, oferująca bazę danych PostgreSQL, uwierzytelnianie i storage.",
    source: "ai-full",
    generation_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 6,
    front: "Co to jest spaced repetition?",
    back: "Spaced repetition to technika uczenia się, która wykorzystuje rosnące odstępy czasowe między powtórkami materiału dla lepszego zapamiętywania.",
    source: "ai-edited",
    generation_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function FlashcardList({ userJson }: FlashcardListProps) {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const user: User | null = useMemo(() => (userJson ? JSON.parse(userJson) : null), [userJson]);

  useEffect(() => {
    const fetchFlashcards = async () => {
      // eslint-disable-next-line no-console
      console.log("FlashcardList - userJson:", userJson);
      // eslint-disable-next-line no-console
      console.log("FlashcardList - user:", user);

      // If user is not logged in, use dummy data
      if (!user) {
        // eslint-disable-next-line no-console
        console.log("No user - showing dummy flashcards");
        setFlashcards(DUMMY_FLASHCARDS);
        setLoading(false);
        return;
      }

      // Fetch real flashcards for authenticated users
      try {
        // eslint-disable-next-line no-console
        console.log("Fetching flashcards for user:", user.id);
        setLoading(true);
        const response = await fetch("/api/flashcards");

        // eslint-disable-next-line no-console
        console.log("API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          // eslint-disable-next-line no-console
          console.error("API error response:", errorText);
          throw new Error("Failed to fetch flashcards");
        }

        const result = await response.json();
        // eslint-disable-next-line no-console
        console.log("API result:", result);
        // API returns paginated response with { data: FlashcardDTO[], pagination: {...} }
        setFlashcards(result.data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching flashcards:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [userJson, user]);

  const toggleFlip = (id: number) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleKeyDown = (id: number, event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-blue-100/90 text-lg">Ładowanie fiszek...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-500/10 backdrop-blur-lg rounded-xl p-8 border border-red-500/20">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-red-200">Wystąpił błąd</h3>
          <p className="mt-2 text-red-100/80">{error}</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0 && user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-blue-500/10 backdrop-blur-lg rounded-xl p-12 border border-blue-500/20 max-w-md">
          <svg className="mx-auto h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-6 text-2xl font-semibold text-blue-200">Brak fiszek</h3>
          <p className="mt-3 text-blue-100/80 leading-relaxed">
            Nie masz jeszcze żadnych fiszek. Zacznij generować fiszki z AI lub dodaj je ręcznie.
          </p>
          <div className="mt-6">
            <a
              href="/generate"
              className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Generuj fiszki z AI
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((flashcard) => {
          const isFlipped = flippedCards.has(flashcard.id);
          return (
            <div
              key={flashcard.id}
              className="relative h-64 cursor-pointer perspective-1000"
              role="button"
              tabIndex={0}
              onClick={() => toggleFlip(flashcard.id)}
              onKeyDown={(e) => handleKeyDown(flashcard.id, e)}
              aria-label={`Flip flashcard: ${flashcard.front_text}`}
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Front Side - Question */}
                <div
                  className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 flex flex-col justify-between"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 mb-4">
                      {flashcard.source}
                    </div>
                    <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                      {flashcard.front}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center">
                    <p className="text-sm text-blue-100/50 text-center">Kliknij, aby zobaczyć odpowiedź</p>
                  </div>
                </div>

                {/* Back Side - Answer */}
                <div
                  className="absolute w-full h-full backface-hidden bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-lg rounded-xl p-6 border border-white/10 flex flex-col justify-between"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-200 mb-4">
                      Odpowiedź
                    </div>
                    <p className="text-base text-white/90 leading-relaxed">{flashcard.back}</p>
                  </div>
                  <div className="flex items-center justify-center pt-4 border-t border-white/10">
                    <p className="text-xs text-green-100/50">Kliknij, aby wrócić do pytania</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
