import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Send, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useUser } from "../context/UserContext";
import { UserProfileModal } from "./UserProfileModal";
import {
  fetchChatGroups,
  fetchChatMessages,
  postChatMessage,
  postChatMessageWithImage,
  type ChatGroup,
  type ChatMessage,
} from "../lib/api";

export function ChatGroupScreen() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useUser();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ name: string; course: string; specialization: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    void fetchChatGroups(accessToken).then(setGroups).catch(() => setGroups([]));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !groupId) {
      return;
    }
    let isCancelled = false;
    const loadMessages = async () => {
      try {
        const data = await fetchChatMessages(accessToken, groupId);
        if (!isCancelled) {
          setMessages(data);
        }
      } catch {
        if (!isCancelled) {
          setMessages([]);
        }
      }
    };
    void loadMessages();
    const intervalId = window.setInterval(() => {
      void loadMessages();
    }, 3000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [accessToken, groupId]);

  const activeGroup = groups.find((group) => String(group.id) === groupId);
  const groupName = activeGroup?.display_name ?? "Чат";
  const isRemindersChat = activeGroup?.group_type === "reminders";

  const handleSend = async () => {
    if (isSending || ((!newMessage.trim() && !selectedImageFile) || !accessToken || !groupId)) return;
    const messageText = newMessage.trim();
    setIsSending(true);
    setSendError(null);
    try {
      const created = selectedImageFile
        ? await postChatMessageWithImage(accessToken, groupId, messageText, selectedImageFile)
        : await postChatMessage(accessToken, groupId, messageText);
      setMessages((prev) => [...prev, created]);
      setNewMessage("");
      setSelectedImage(null);
      setSelectedImageFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Не вдалося надіслати повідомлення.");
    } finally {
      setIsSending(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSendError(null);
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserClick = (message: ChatMessage) => {
    if (message.is_system || !message.sender_email) return;
    setSelectedUser({
      name: message.sender_name ?? message.sender_email.split("@")[0],
      course: user?.course ?? "",
      specialization: user?.specialization ?? "",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate("/app/chat")}
              className="flex items-center gap-2 mb-2 text-gray-600 hover:text-black"
            >
              <ArrowLeft size={20} />
              Назад
            </button>
            <h1 className="text-xl">{groupName}</h1>
            {isRemindersChat && (
              <p className="text-sm text-gray-500 mt-1">Важливі повідомлення від системи</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="max-w-md mx-auto space-y-4">
            {isRemindersChat && messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <AlertCircle size={48} className="mx-auto mb-2 text-gray-400" />
                <p>Наразі немає нових нагадувань</p>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-3 ${
                  message.is_system
                    ? "bg-orange-50 border-orange-200"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => handleUserClick(message)}
                    disabled={message.is_system || !message.sender_email}
                    className={`font-medium ${
                      !message.is_system && message.sender_email
                        ? "hover:text-blue-600 cursor-pointer"
                        : ""
                    }`}
                  >
                    {message.sender_name ?? (message.sender_email ? message.sender_email.split("@")[0] : "Система")}
                  </button>
                  <span className="text-xs text-gray-500">{new Date(message.created_at).toLocaleString("uk-UA")}</span>
                </div>
                <p className="text-gray-700 mb-2">{message.text}</p>
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="Вкладення"
                    className="mt-2 rounded-lg max-w-full h-auto"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

          {!isRemindersChat && (
          <div className="bg-white border-t border-gray-200 p-4 fixed bottom-0 left-0 right-0">
            <div className="max-w-md mx-auto">
              {selectedImage && (
                <div className="mb-2 relative inline-block">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="h-20 rounded border border-gray-200"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon size={20} className="text-gray-600" />
                </button>
                <input
                  type="text"
                  placeholder="Написати повідомлення..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  onClick={handleSend}
                  disabled={isSending || (!newMessage.trim() && !selectedImage)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  Надіслати
                </button>
              </div>
              {sendError && (
                <p className="mt-2 text-sm text-red-600">{sendError}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </>
  );
}
