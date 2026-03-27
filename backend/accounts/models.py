from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.TextChoices):
    ADMIN   = "admin",   "Admin"
    MANAGER = "manager", "Manager"
    STAFF   = "staff",   "Staff"


class UserManager(BaseUserManager):
    """Custom manager – username is gone, email is the identifier."""

    def _create_user(self, email: str, password: str, role: str, **extra):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user  = self.model(email=email, role=role, **extra)
        user.set_password(password)
        # Nobody except Django's own superuser touches the admin panel
        user.is_staff       = False
        user.is_superuser   = False
        user.save(using=self._db)
        return user

    # ── Public helpers ────────────────────────────────────────────────

    def create_admin(self, email: str, password: str, **extra):
        """Registers a project-admin (the only self-service role)."""
        return self._create_user(email, password, Role.ADMIN, **extra)

    def create_manager(self, email: str, password: str, **extra):
        """Created by the system when a project is spun up."""
        return self._create_user(email, password, Role.MANAGER, **extra)

    def create_staff(self, email: str, password: str, **extra):
        """Created by the system when a project is spun up."""
        return self._create_user(email, password, Role.STAFF, **extra)

    def create_superuser(self, email: str, password: str, **extra):
        """Django superuser – only accessible via manage.py createsuperuser."""
        extra.setdefault("is_staff",     True)
        extra.setdefault("is_superuser", True)
        return self._create_user(email, password, Role.ADMIN, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Virelix custom user model.

    is_staff / is_superuser stay False for every role except Django's own
    internal superuser so that no one can reach the /admin panel.

    gemini_api_key stores the Fernet-encrypted key; it is written / read
    exclusively through the service layer (accounts/services/user_service.py).
    """

    email           = models.EmailField(unique=True)
    role            = models.CharField(max_length=10, choices=Role.choices, default=Role.ADMIN)
    gemini_api_key  = models.TextField(blank=True, null=True)   # Fernet-encrypted
    is_active       = models.BooleanField(default=True)
    is_staff        = models.BooleanField(default=False)        # Keep False for all app users
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    objects         = UserManager()

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering  = ["-created_at"]
        verbose_name        = "User"
        verbose_name_plural = "Users"

    def __str__(self) -> str:
        return f"{self.email} ({self.role})"

    # ── Convenience flags ─────────────────────────────────────────────

    @property
    def is_admin(self) -> bool:
        return self.role == Role.ADMIN

    @property
    def is_manager(self) -> bool:
        return self.role == Role.MANAGER

    @property
    def is_staff_member(self) -> bool:
        """Disambiguates from Django's built-in is_staff flag."""
        return self.role == Role.STAFF

    @property
    def has_gemini_key(self) -> bool:
        return bool(self.gemini_api_key)