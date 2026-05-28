import { useNavigate } from "react-router";
import { X, User, GraduationCap, BookOpen, MessageCircle } from "lucide-react";

interface UserProfileModalProps {
  user: {
    name: string;
    course: string;
    specialization: string;
  };
  onClose: () => void;
}

export function UserProfileModal({ user, onClose }: UserProfileModalProps) {
  const navigate = useNavigate();

  const handleStartChat = () => {
    // Navigate to private chat with this user
    navigate(`/app/chat/private-${user.name.toLowerCase()}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">Профіль користувача</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={40} className="text-gray-400" />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
            <User className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 mb-1">Ім'я</p>
              <p className="text-lg">{user.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
            <GraduationCap className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 mb-1">Курс</p>
              <p className="text-lg">{user.course} курс</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BookOpen className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 mb-1">Спеціальність</p>
              <p className="text-lg">{user.specialization}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
