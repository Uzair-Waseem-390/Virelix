"""
data_entry/serializers.py
──────────────────────────
Input validation for data_entry views.
Zero business logic here.
"""

from rest_framework import serializers


class VerifyPasswordSerializer(serializers.Serializer):
    """Body of POST /data_entry/verify-password/"""
    password = serializers.CharField(required=True)


class GenerateDataSerializer(serializers.Serializer):
    """Body of POST /data_entry/generate/"""
    password        = serializers.CharField(required=True)
    project_id      = serializers.IntegerField(required=True, min_value=1)
    user_id         = serializers.IntegerField(required=True, min_value=1)
    start_date      = serializers.DateField(required=True)
    duration_days   = serializers.IntegerField(required=True, min_value=1,   max_value=3650)
    customers_count = serializers.IntegerField(required=True, min_value=0,   max_value=10000)
    products_count  = serializers.IntegerField(required=True, min_value=1,   max_value=500)
    orders_per_day  = serializers.IntegerField(required=True, min_value=1,   max_value=1000)
