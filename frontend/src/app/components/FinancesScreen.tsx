import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { Wallet, Calendar, AlertCircle, FileText } from "lucide-react";
import { fetchFinance, type FinanceResponse } from "../lib/api";

function normalizeScholarshipStatus(value?: string) {
  if (value === "academic") {
    return "академічна";
  }
  return value ?? "";
}

export function FinancesScreen() {
  const { user, accessToken } = useUser();
  const [showRequisites, setShowRequisites] = useState(false);
  const [finance, setFinance] = useState<FinanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    const loadFinance = async () => {
      try {
        setError(null);
        const data = await fetchFinance(accessToken);
        setFinance(data);
      } catch {
        setError("Не вдалося завантажити фінансові дані.");
      }
    };
    void loadFinance();
  }, [accessToken]);

  const isBudget = finance?.funding_type === "budget";

  if (!finance && !error) {
    return <div className="min-h-screen bg-gray-50 p-4"><div className="max-w-md mx-auto">Завантаження...</div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 p-4"><div className="max-w-md mx-auto text-red-600">{error}</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl mb-6">Фінанси</h1>

        {isBudget ? (
          <div className="space-y-4">
            {/* Type Card */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wallet className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Тип</p>
                  <p className="text-xl font-semibold">Бюджет</p>
                </div>
              </div>
            </div>

            {/* Scholarship Info */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold mb-4">Інформація про стипендію</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Стипендія:</span>
                  <span className="font-medium">
                    {normalizeScholarshipStatus(finance?.scholarship_status)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Розмір:</span>
                  <span className="font-medium">{finance?.scholarship_amount} грн/міс</span>
                </div>
              </div>
            </div>

            {/* Next Payment Date */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <Calendar className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="font-medium text-green-900 mb-1">
                    Дата наступної виплати
                  </p>
                  <p className="text-green-700">{finance?.next_funding_date}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Type Card */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Wallet className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Тип</p>
                  <p className="text-xl font-semibold">Контракт</p>
                </div>
              </div>
            </div>

            {/* Payment Reminder */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-1" size={20} />
                <div>
                  <p className="font-medium text-red-900 mb-1">
                    Нагадування про оплату
                  </p>
                  <p className="text-red-700 text-sm">
                    Не забудьте внести оплату до дедлайну
                  </p>
                </div>
              </div>
            </div>

            {/* Requisites Button */}
            <button
              onClick={() => setShowRequisites(!showRequisites)}
              className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              {showRequisites ? "Приховати реквізити" : "Переглянути реквізити"}
            </button>

            {/* Requisites Details */}
            {showRequisites && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-4">Реквізити для оплати</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Отримувач:</p>
                    <p className="font-medium">
                      {finance?.payment_requisites.receiver_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">IBAN:</p>
                    <p className="font-mono font-medium text-xs break-all">
                      {finance?.payment_requisites.iban}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">ЄДРПОУ:</p>
                    <p className="font-medium">{finance?.payment_requisites.edrpou}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Призначення платежу:</p>
                    <p className="font-medium">
                      Оплата за навчання, {user.name}, {user.course} курс,{" "}
                      {user.specialization}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded p-3 mt-3">
                    <p className="text-xs text-gray-700">
                      <strong>Важливо:</strong> Обов'язково вказуйте правильне
                      призначення платежу для коректного зарахування коштів.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
