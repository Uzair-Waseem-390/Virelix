from django.db import models
from django.conf import settings


class DataEntryStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    SUCCESS = "success", "Success"
    FAILED  = "failed",  "Failed"


class DataEntryHistory(models.Model):
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="data_entry_histories"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="data_entries"
    )
    parameters = models.JSONField(
        default=dict,
        help_text="The parameters used for data generation."
    )
    status = models.CharField(
        max_length=20,
        choices=DataEntryStatus.choices,
        default=DataEntryStatus.PENDING
    )
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Data Entry History"
        verbose_name_plural = "Data Entry Histories"

    def __str__(self):
        return f"History #{self.pk} [Project: {self.project.name}] - {self.get_status_display()}"
