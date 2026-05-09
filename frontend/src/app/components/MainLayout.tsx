import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
import { Home, MessageCircle, Wallet, User } from "lucide-react";
import { AIAssistant } from "./AIAssistant";
import logoImage from "../../imports/IMG_duck.PNG";
import { useUser } from "../context/UserContext";

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useUser();
  const hideBottomNav = /^\/app\/chat\/[^/]+$/.test(location.pathname);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [isLoading, navigate, user]);

  if (isLoading || !user) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/app" && location.pathname === "/app") return true;
    if (path !== "/app" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar with Logo */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src={logoImage}
            alt="STUD HUB"
            className="w-10 h-10 object-contain rounded-full"
          />
          <h1 className="text-xl font-semibold">STUD HUB</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto pb-16">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      {!hideBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-md mx-auto flex">
            <button
              onClick={() => navigate("/app")}
              className={`flex-1 flex flex-col items-center py-3 ${
                isActive("/app") && location.pathname === "/app"
                  ? "text-black"
                  : "text-gray-400"
              }`}
            >
              <Home size={24} />
              <span className="text-xs mt-1">Головна</span>
            </button>
            <button
              onClick={() => navigate("/app/chat")}
              className={`flex-1 flex flex-col items-center py-3 ${
                isActive("/app/chat") ? "text-black" : "text-gray-400"
              }`}
            >
              <MessageCircle size={24} />
              <span className="text-xs mt-1">Чат</span>
            </button>
            <button
              onClick={() => navigate("/app/finances")}
              className={`flex-1 flex flex-col items-center py-3 ${
                isActive("/app/finances") ? "text-black" : "text-gray-400"
              }`}
            >
              <Wallet size={24} />
              <span className="text-xs mt-1">Фінанси</span>
            </button>
            <button
              onClick={() => navigate("/app/profile")}
              className={`flex-1 flex flex-col items-center py-3 ${
                isActive("/app/profile") ? "text-black" : "text-gray-400"
              }`}
            >
              <User size={24} />
              <span className="text-xs mt-1">Профіль</span>
            </button>
          </div>
        </div>
      )}

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
