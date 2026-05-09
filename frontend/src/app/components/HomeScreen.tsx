import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { useUser } from "../context/UserContext";
import { fetchSubjects, type Subject } from "../lib/api";

const subjectIcons: Record<string, string> = {
  math: "📐",
  physics: "⚛️",
  programming: "💻",
  algorithms: "🔢",
  databases: "🗄️",
  networks: "🌐",
};

export function HomeScreen() {
  const navigate = useNavigate();
  const { accessToken } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const loadSubjects = async () => {
      try {
        setError(null);
        const data = await fetchSubjects(accessToken);
        setSubjects(data);
      } catch {
        setError("Не вдалося завантажити предмети.");
      }
    };
    void loadSubjects();
  }, [accessToken]);

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl mb-6">Предмети</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Пошук предметів..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* Subjects List */}
        {error && (
          <div className="mb-4 text-red-600">{error}</div>  
        )}
        <div className="space-y-3">
          {filteredSubjects.map((subject) => (  // loop
            <div
              key={subject.slug}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{subjectIcons[subject.slug] ?? "📚"}</span>
                <span className="text-lg">{subject.name}</span>
              </div>
              <button
                onClick={() => navigate(`/app/subject/${subject.slug}`)}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                Відкрити
              </button>
            </div>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Предмети не знайдено
          </div>
        )}
      </div>
    </div>
  );
}
