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

function PaymentBlock() {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold mb-4">Блок для оплати</h3>
      <div className="space-y-4 text-sm text-gray-800">
        <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
          <div className="space-y-4 leading-6">
            <div className="text-base font-semibold text-gray-900">
              Оплата за навчання
            </div>
            <div className="text-sm text-gray-700">
              Реквізити для оплати за навчання:
            </div>

            <div className="space-y-3">
              <div className="grid gap-1">
                <span className="text-gray-600">Отримувач платежу:</span>
                <span className="font-medium">Львівська Політехніка</span>
              </div>
              <div className="grid gap-1">
                <span className="text-gray-600">Р/р:</span>
                <span className="font-mono break-all font-medium">
                  UA388201720313241002201001057
                </span>
              </div>
              <div className="grid gap-1">
                <span className="text-gray-600">ЄДРПОУ:</span>
                <span className="font-medium">02071010</span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div className="grid gap-1">
                <span className="text-gray-600">Оплата за навчання</span>
                <span className="border-b border-gray-400 min-h-6"></span>
                <span className="text-xs text-gray-500">
                  (прізвище, ініціали Студента)
                </span>
              </div>

              <div className="grid gap-2">
                <div className="grid gap-1">
                  <span className="text-gray-600">(інститут скор.)</span>
                  <span className="border-b border-gray-400 min-h-6"></span>
                </div>

                <div className="grid gap-1">
                  <span className="text-gray-600">(спец.скор)</span>
                  <span className="border-b border-gray-400 min-h-6"></span>
                </div>

                <div className="grid gap-1">
                  <span className="text-gray-600">Платник</span>
                  <span className="border-b border-gray-400 min-h-6"></span>
                  <span className="text-xs text-gray-500">
                    (прізвище, ініціали Замовника)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded p-3 text-xs text-blue-900">
          Дані в блоці можна скопіювати у квитанцію або використати як шаблон для оплати.
        </div>
      </div>
    </div>
  );
}

function RequisitesBlock({ user }: { user: { name: string; course: string; specialization: string } }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold mb-4">Реквізити для оплати</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-600 mb-1">Отримувач:</p>
          <p className="font-medium">Львівська Політехніка</p>
        </div>
        <div>
          <p className="text-gray-600 mb-1">IBAN:</p>
          <p className="font-mono font-medium text-xs break-all">
            UA388201720313241002201001057
          </p>
        </div>
        <div>
          <p className="text-gray-600 mb-1">ЄДРПОУ:</p>
          <p className="font-medium">02071010</p>
        </div>
        <div className="bg-yellow-50 rounded p-3 mt-3">
          <p className="text-xs text-gray-700">
            <strong>Важливо:</strong> Обов'язково вказуйте правильне
            призначення платежу для коректного зарахування коштів.
          </p>
        </div>
      </div>
    </div>
  );
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
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl mb-6">Фінанси</h1>

        {isBudget ? (
          <div className="space-y-4">
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

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <Calendar className="text-green-600 mt-1" size={20} />
                <div>
                  <p className="font-medium text-green-900 mb-1">Дата наступної виплати</p>
                  <p className="text-green-700">{finance?.next_funding_date}</p>
                </div>
              </div>
            </div>

            <RequisitesBlock user={user} />
            <PaymentBlock />
          </div>
        ) : (
          <div className="space-y-4">
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

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 mt-1" size={20} />
                <div>
                  <p className="font-medium text-red-900 mb-1">Нагадування про оплату</p>
                  <p className="text-red-700 text-sm">Не забудьте внести оплату до дедлайну</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRequisites(!showRequisites)}
              className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              {showRequisites ? "Приховати реквізити" : "Переглянути реквізити"}
            </button>

            {showRequisites && (
              <>
                <RequisitesBlock user={user} />
                <PaymentBlock />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
