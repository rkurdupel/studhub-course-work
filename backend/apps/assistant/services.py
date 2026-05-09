from decimal import Decimal

from apps.accounts.models import StudentProfile


ACCOUNT_OFFICE_FALLBACK = (
    "На жаль, я не маю відповіді на це питання. "
    "Будь ласка, зверніться до навчальної частини університету."
)


def format_money(value):
    return f"{Decimal(str(value)):.2f}"


def format_date(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def contains_any(text, keywords):
    return any(keyword in text for keyword in keywords)


def build_rule_based_response(profile, message):
    text = message.lower()
    if contains_any(text, ("hello", "hi", "hey", "привіт", "добрий день", "доброго дня")):
        return "Привіт! Чим можу допомогти?"

    if contains_any(text, ("дякую", "thanks", "thank you", "спасибі")):
        return "Будь ласка!"

    if contains_any(text, ("хто ти", "who are you", "що ти вмієш", "what can you do", "help")):
        return (
            "Я асистент STUD HUB. Можу допомогти з питаннями про матеріали, "
            "стипендію, оплату, борг та сесію."
        )

    if contains_any(text, ("debt", "payment", "tuition", "борг", "оплат", "контракт")):
        if profile.funding_type == StudentProfile.FUNDING_TYPE_PAID:
            finance = profile.paid_finance
            return (
                f"Ваш поточний борг становить {format_money(finance.current_debt)} UAH. "
                f"Дедлайн оплати: {format_date(finance.payment_deadline)}."
            )
        return "Ви навчаєтесь на бюджеті, тому оплата за навчання для вас не застосовується."

    if contains_any(text, ("scholarship", "stipend", "стипенді", "виплат")):
        if profile.funding_type == StudentProfile.FUNDING_TYPE_BUDGET:
            finance = profile.budget_finance
            return (
                f"Розмір вашої стипендії становить {format_money(finance.scholarship_amount)} UAH. "
                f"Дата наступної виплати: {format_date(finance.next_funding_date)}."
            )
        return "Студенти контрактної форми навчання не отримують університетську стипендію."

    if contains_any(text, ("session", "exam", "сес", "екзам")):
        return (
            "Інформація про сесію зазвичай публікується у розкладі та повідомленнях "
            "деканату. Перевірте розклад або зверніться до викладача чи куратора групи."
        )

    if contains_any(text, ("material", "materials", "lecture", "notes", "матеріал", "лекц")):
        return (
            "Навчальні матеріали можна знайти у розділі предметів у застосунку. "
            "Відкрийте потрібний предмет, щоб переглянути доступні файли."
        )

    return ACCOUNT_OFFICE_FALLBACK


def build_assistant_response(profile, message):
    return build_rule_based_response(profile, message)
