"""
accounts/services/crypto.py
──────────────────────────
Single-responsibility module that handles every crypto concern for
the Gemini API key:  encryption, decryption, and key validation.

All other parts of the codebase import from here – never duplicate
this logic elsewhere (DRY).
"""

from django.core.exceptions import ImproperlyConfigured
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


# ── Fernet singleton ──────────────────────────────────────────────────────────

def _get_fernet() -> Fernet:
    key = getattr(settings, "FERNET_KEY", None)
    if not key:
        raise ImproperlyConfigured(
            "FERNET_KEY is not set in settings. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


_fernet = _get_fernet()


# ── Public helpers ────────────────────────────────────────────────────────────

def encrypt_api_key(api_key: str) -> str:
    """Return the Fernet-encrypted, URL-safe base64 string."""
    return _fernet.encrypt(api_key.strip().encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt a previously encrypted Gemini API key.
    Raises ``InvalidToken`` if the ciphertext has been tampered with.
    """
    return _fernet.decrypt(encrypted_key.encode()).decode()


def validate_gemini_key(api_key: str) -> bool:
    """
    Ping the Gemini API to confirm the key is authentic.

    Returns True  -> key is valid and authenticated.
    Returns False -> key is invalid, malformed, or any Google API error occurred.
    Never raises  -> all exceptions are swallowed and mapped to False so callers
                    always receive a clean boolean and can return a proper 400.
    """
    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key.strip())
        for _ in genai.list_models():
            return True
        return True

    except Exception:   # noqa: BLE001
        # Any exception (InvalidArgument, Unauthenticated, network error, etc.)
        # means the key could not be confirmed valid -> return False cleanly.
        return False