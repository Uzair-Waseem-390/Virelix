"""
ai_agent/exceptions.py
───────────────────────
Custom exception hierarchy for the AI agent layer.

Using typed exceptions instead of plain ValueError gives callers
fine-grained control over error handling and HTTP status mapping.
"""


class AIAgentError(Exception):
    """Base class for all AI agent errors."""


class MissingAPIKeyError(AIAgentError):
    """Raised when the admin has no Gemini API key configured."""


class InvalidAPIKeyError(AIAgentError):
    """Raised when the Gemini API key fails authentication."""


class EmptyDescriptionError(AIAgentError):
    """Raised when the project description is blank."""


class AgentParseError(AIAgentError):
    """Raised when the agent response cannot be parsed into ERPModuleConfig."""


class AgentNetworkError(AIAgentError):
    """Raised on network/timeout failures - eligible for Celery retry."""