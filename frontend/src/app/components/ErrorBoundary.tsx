import { useRouteError, useNavigate } from "react-router";
import { AlertCircle } from "lucide-react";

export function ErrorBoundary() {
  const error = useRouteError() as Error;
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-6 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h1 className="text-xl mb-2">Щось пішло не так</h1>
        <p className="text-gray-600 mb-6">
          {error?.message || "Виникла помилка"}
        </p>
        <button
          onClick={() => navigate("/")}
          className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
        >
          На головну
        </button>
      </div>
    </div>
  );
}
