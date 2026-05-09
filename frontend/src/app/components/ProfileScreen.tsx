import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";
import { LogOut, User, Mail, GraduationCap, BookOpen, Wallet } from "lucide-react";
import logoImage from "../../imports/IMG_duck.PNG";

export function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl mb-6">Профіль</h1>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
          <div className="flex items-center justify-center mb-6">
            <img
              src={logoImage}
              alt="Profile"
              className="w-24 h-24 object-contain rounded-full"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <User className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500 mb-1">Ім'я</p>
                <p className="text-lg">{user.fullName || user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <Mail className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="text-lg">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <GraduationCap className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500 mb-1">Курс</p>
                <p className="text-lg">{user.course} курс</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
              <BookOpen className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500 mb-1">Спеціальність</p>
                <p className="text-lg">{user.specialization}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Wallet className="text-gray-400 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500 mb-1">Фінансовий статус</p>
                <p className="text-lg">{user.financialStatus}</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Вийти
        </button>
      </div>
    </div>
  );
}
