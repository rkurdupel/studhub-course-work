import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, FileText, Download } from "lucide-react";
import {
  buildMediaUrl,
  fetchSubjectMaterials,
  fetchSubjects,
  getSubjectMaterialDownloadUrl,
  type SubjectMaterial,
} from "../lib/api";
import { useUser } from "../context/UserContext";

export function SubjectScreen() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useUser();
  const [files, setFiles] = useState<SubjectMaterial[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !subjectId) {
      return;
    }
    const loadMaterials = async () => {
      try {
        setError(null);
        const [materials, subjects] = await Promise.all([
          fetchSubjectMaterials(accessToken, subjectId),
          fetchSubjects(accessToken),
        ]);
        setFiles(materials);
        const currentSubject = subjects.find((subject) => subject.slug === subjectId);
        setSubjectName(currentSubject?.name ?? subjectId);
      } catch {
        setError("Не вдалося завантажити матеріали.");
      }
    };
    void loadMaterials();
  }, [accessToken, subjectId]);

  const handleOpen = (path: string) => {
    window.open(buildMediaUrl(path), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        <button
          onClick={() => navigate("/app")}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-black"
        >
          <ArrowLeft size={20} />
          Назад
        </button>

        <h1 className="text-2xl mb-6">{subjectName || subjectId}</h1>

        {error && <p className="mb-4 text-red-600">{error}</p>}

        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <FileText className="text-gray-400 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="mb-1">{file.title}</h3>
                  <p className="text-sm text-gray-500">{file.original_filename}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={getSubjectMaterialDownloadUrl(file.id)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Завантажити
                </a>
                <button
                  onClick={() => handleOpen(file.file_url)}
                  className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                >
                  Відкрити
                </button>
              </div>
            </div>
          ))}
          {files.length === 0 && !error && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-500">
              Для цього предмета ще немає завантажених матеріалів.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
