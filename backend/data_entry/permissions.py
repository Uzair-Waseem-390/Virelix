from rest_framework.permissions import BasePermission
from django.conf import settings

class HasDataEntryPassword(BasePermission):
    """
    Allows access only to users who provide the correct data entry password.
    The password can be in the request headers as 'X-DataEntry-Password'
    or in the POST request body data as 'password'.
    """
    
    def has_permission(self, request, view):
        expected_password = getattr(settings, "DATAENTRY_PASSWORD", None)
        if not expected_password:
            # If the password is not set in settings, deny access for safety
            return False

        provided_password = request.headers.get("X-DataEntry-Password")
        
        if not provided_password and request.data:
            provided_password = request.data.get("password")
        
        if not provided_password and request.query_params:
            provided_password = request.query_params.get("password")
            
        return provided_password == expected_password
