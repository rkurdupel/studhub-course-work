import os
from pathlib import Path

from dotenv import dotenv_values
from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE_VALUES = {
    key: value
    for key, value in dotenv_values(BASE_DIR / ".env").items()
    if value is not None
}


def env(name: str, default: str | None = None) -> str | None:
    if name in os.environ:
        return os.environ[name]
    return ENV_FILE_VALUES.get(name, default)


DJANGO_ENV = env("DJANGO_ENV", "development").strip().lower()
IS_DEVELOPMENT = DJANGO_ENV == "development"


def runtime_env(name: str, default: str | None = None) -> str | None:
    if name in os.environ:
        return os.environ[name]
    if IS_DEVELOPMENT:
        return ENV_FILE_VALUES.get(name, default)
    return default


def env_flag(name: str, default: bool) -> bool:
    value = runtime_env(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


DEBUG = env_flag("DJANGO_DEBUG", IS_DEVELOPMENT)


def get_secret_key() -> str:
    secret_key = runtime_env("DJANGO_SECRET_KEY")
    if secret_key:
        return secret_key
    if IS_DEVELOPMENT:
        return "dev-secret-key"
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY must be set when DJANGO_ENV is not 'development'."
    )


def get_allowed_hosts() -> list[str]:
    raw_hosts = runtime_env("DJANGO_ALLOWED_HOSTS")
    if raw_hosts:
        hosts = [host.strip() for host in raw_hosts.split(",") if host.strip()]
        if hosts:
            return hosts
    if IS_DEVELOPMENT:
        return ["localhost", "127.0.0.1"]
    raise ImproperlyConfigured(
        "DJANGO_ALLOWED_HOSTS must be set when DJANGO_ENV is not 'development'."
    )


def get_cors_allowed_origins() -> list[str]:
    raw_origins = runtime_env("DJANGO_CORS_ALLOWED_ORIGINS", "")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def get_csrf_trusted_origins() -> list[str]:
    raw_origins = runtime_env("DJANGO_CSRF_TRUSTED_ORIGINS", "")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


SECRET_KEY = get_secret_key()
ALLOWED_HOSTS = get_allowed_hosts()
CORS_ALLOWED_ORIGINS = get_cors_allowed_origins()
CSRF_TRUSTED_ORIGINS = get_csrf_trusted_origins()

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "apps.accounts",
    "apps.assistant",
    "apps.chat",
    "apps.finance",
    "apps.subjects",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

if runtime_env("DJANGO_DB_BACKEND") == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": runtime_env("POSTGRES_DB", "studhub"),
            "USER": runtime_env("POSTGRES_USER", "studhub"),
            "PASSWORD": runtime_env("POSTGRES_PASSWORD", "studhub"),
            "HOST": runtime_env("POSTGRES_HOST", "localhost"),
            "PORT": runtime_env("POSTGRES_PORT", "5432"),
        }
    }

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}

CORS_ALLOW_CREDENTIALS = True
