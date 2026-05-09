import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";
import logoImage from "../../imports/IMG_duck.PNG";
import { ApiError, fetchProfile, loginRequest, registerRequest } from "../lib/api";

function formatAuthError(data: unknown, fallbackMessage: string) {
  if (typeof data !== "object" || data === null) {
    return fallbackMessage;
  }

  if ("detail" in data) {
    return String((data as { detail: unknown }).detail);
  }

  const fieldErrors = data as Record<string, unknown>;

  if ("email" in fieldErrors) {
    const emailError = Array.isArray(fieldErrors.email)
      ? String(fieldErrors.email[0] ?? "")
      : String(fieldErrors.email);

    if (emailError.includes("valid email")) {
      return "Введіть коректний email.";
    }
    if (emailError.includes("already exists")) {
      return "Користувач з таким email вже існує.";
    }
    return emailError;
  }

  if ("password" in fieldErrors) {
    const passwordError = Array.isArray(fieldErrors.password)
      ? String(fieldErrors.password[0] ?? "")
      : String(fieldErrors.password);

    if (passwordError.includes("at least 8 characters")) {
      return "Пароль має містити щонайменше 8 символів.";
    }
    return passwordError;
  }

  const firstFieldError = Object.values(fieldErrors).find(
    (value) => typeof value === "string" || Array.isArray(value)
  );

  if (Array.isArray(firstFieldError)) {
    return String(firstFieldError[0] ?? fallbackMessage);
  }
  if (typeof firstFieldError === "string") {
    return firstFieldError;
  }

  return fallbackMessage;
}

export function LoginScreen() {
  const navigate = useNavigate();
  const { login, isLoading, user } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    course: "1",
    specialization: "СА",
    financialStatus: "Бюджет" as "Контракт" | "Бюджет",
  });

  const switchMode = (nextIsLogin: boolean) => {
    setIsLogin(nextIsLogin);
    setError(null);
  };

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/app");
    }
  }, [isLoading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!isLogin) {
        const fundingType = formData.financialStatus === "Бюджет" ? "budget" : "paid";
        await registerRequest({
          full_name: formData.name,
          email: formData.email,
          password: formData.password,
          course: formData.course,
          specialization: formData.specialization,
          funding_type: fundingType,
          ...(fundingType === "budget"
            ? {
                scholarship_amount: "2000.00",
                scholarship_status: "академічна",
                next_funding_date: "2026-06-01",
              }
            : {
                tuition_amount: "15000.00",
                current_debt: "5000.00",
                payment_deadline: "2026-05-15",
              }),
        });
      }

      const tokens = await loginRequest(formData.email, formData.password);
      const profile = await fetchProfile(tokens.access);
      login({
        accessToken: tokens.access,
        refreshToken: tokens.refresh,
        user: {
          name: profile.full_name || profile.email.split("@")[0],
          fullName: profile.full_name,
          email: profile.email,
          course: profile.course,
          specialization: profile.specialization,
          financialStatus: profile.funding_type === "budget" ? "Бюджет" : "Контракт",
          fundingType: profile.funding_type,
        },
      });
      navigate("/app");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(formatAuthError(err.data, err.message));
      } else {
        setError("Не вдалося виконати запит. Перевірте, що бекенд запущений.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoImage}
              alt="STUD HUB Logo"
              className="w-24 h-24 object-contain rounded-full"
            />
          </div>
          <h1 className="text-3xl mb-2">STUD HUB</h1>
          <p className="text-gray-600">Навчальні матеріали та спілкування</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 px-4 rounded ${
                isLogin
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Увійти
            </button>
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 px-4 rounded ${
                !isLogin
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Зареєструватися
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm mb-1 text-gray-700">
                  Ім'я
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm mb-1 text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-700">
                Пароль
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">
                    Курс
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="1">1 курс</option>
                    <option value="2">2 курс</option>
                    <option value="3">3 курс</option>
                    <option value="4">4 курс</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-gray-700">
                    Спеціальність
                  </label>
                  <select
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="СА">СА</option>
                    <option value="КН">КН</option>
                    <option value="ІПЗ">ІПЗ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-gray-700">
                    Форма навчання
                  </label>
                  <select
                    value={formData.financialStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        financialStatus: e.target.value as "Контракт" | "Бюджет",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  >
                    <option value="Бюджет">Бюджет</option>
                    <option value="Контракт">Контракт</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition-colors"
            >
              {isSubmitting ? "Зачекайте..." : isLogin ? "Увійти" : "Зареєструватися"}
            </button>
            {error && (
              <p className="text-sm text-red-600 break-words">{error}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
