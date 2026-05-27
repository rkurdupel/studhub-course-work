import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { MessageCircle, Bell } from "lucide-react";
import { useUser } from "../context/UserContext";
import { fetchChatGroups, type ChatGroup } from "../lib/api";

export function ChatScreen() {
  const navigate = useNavigate();
  const { accessToken } = useUser();
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const loadChatData = async () => {
      try {
        const groups = await fetchChatGroups(accessToken);
        setChatGroups(groups);
      } catch {
        setChatGroups([]);
      }
    };
    void loadChatData();
    const intervalId = window.setInterval(() => {
      void loadChatData();
    }, 3000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [accessToken]);

  const remindersGroup = chatGroups.find((group) => group.group_type === "reminders");
  const sharedChats = chatGroups.filter((group) => group.group_type !== "reminders");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl mb-6">Чати</h1>

        <div className="space-y-6">
          {remindersGroup && (
            <button
              onClick={() => navigate(`/app/chat/${remindersGroup.id}`)}
              className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-orange-100">
                  <Bell className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{remindersGroup.display_name}</h3>
                  <p className="text-sm text-gray-500">Оголошення</p>
                </div>
              </div>
            </button>
          )}

          <section>
            <div className="flex items-center gap-2 mb-3 text-gray-600">
              <MessageCircle size={18} />
              <h2 className="text-sm font-medium uppercase tracking-wide">Мої чати</h2>
            </div>
            <div className="space-y-2">
              {sharedChats.map((group) => (
                <button
                  key={group.id}
                  onClick={() => navigate(`/app/chat/${group.id}`)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                      <MessageCircle className="text-gray-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{group.display_name}</h3>
                      <p className="text-sm text-gray-500">Спільний чат</p>
                    </div>
                  </div>
                </button>
              ))}
              {sharedChats.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                  Немає доступних чатів
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
