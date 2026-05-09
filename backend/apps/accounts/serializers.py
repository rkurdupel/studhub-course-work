from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from apps.chat.services import assign_default_chat_memberships
from apps.finance.services import create_finance_profile_for_registration as create_finance_profile

from .models import RegistrationFinancePayload, StudentProfile


def create_finance_profile_for_registration(*, user, profile, finance_payload):
    return create_finance_profile(profile=profile, finance_payload=finance_payload)


def store_registration_finance_payload(*, user, profile, finance_payload):
    RegistrationFinancePayload.objects.update_or_create(
        profile=profile,
        defaults={"payload": finance_payload},
    )
    return None


class StudentRegistrationSerializer(serializers.ModelSerializer):
    BUDGET_FIELDS = ("scholarship_amount", "scholarship_status", "next_funding_date")
    PAID_FIELDS = ("tuition_amount", "current_debt", "payment_deadline")

    full_name = serializers.CharField(write_only=True, max_length=255)
    password = serializers.CharField(write_only=True, min_length=8)
    course = serializers.CharField(write_only=True)
    specialization = serializers.CharField(write_only=True)
    funding_type = serializers.ChoiceField(
        choices=StudentProfile.FUNDING_TYPE_CHOICES,
        write_only=True,
    )
    scholarship_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        write_only=True,
    )
    scholarship_status = serializers.CharField(required=False, allow_blank=True, write_only=True)
    next_funding_date = serializers.DateField(required=False, allow_null=True, write_only=True)
    tuition_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        write_only=True,
    )
    current_debt = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
        write_only=True,
    )
    payment_deadline = serializers.DateField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = get_user_model()
        fields = (
            "id",
            "email",
            "full_name",
            "password",
            "course",
            "specialization",
            "funding_type",
            "scholarship_amount",
            "scholarship_status",
            "next_funding_date",
            "tuition_amount",
            "current_debt",
            "payment_deadline",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        funding_type = attrs.get("funding_type")
        if funding_type == StudentProfile.FUNDING_TYPE_BUDGET:
            required_fields = self.BUDGET_FIELDS
            forbidden_fields = self.PAID_FIELDS
        else:
            required_fields = self.PAID_FIELDS
            forbidden_fields = self.BUDGET_FIELDS

        missing_fields = [
            field_name for field_name in required_fields if attrs.get(field_name) in (None, "")
        ]
        forbidden_field_errors = {
            field_name: ["This field is not allowed for the selected funding type."]
            for field_name in forbidden_fields
            if attrs.get(field_name) not in (None, "")
        }
        if missing_fields or forbidden_field_errors:
            raise serializers.ValidationError(
                {
                    **{
                        field_name: ["This field is required for the selected funding type."]
                        for field_name in missing_fields
                    },
                    **forbidden_field_errors,
                }
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        full_name = validated_data.pop("full_name")
        profile_data = {
            "full_name": full_name,
            "course": validated_data.pop("course"),
            "specialization": validated_data.pop("specialization"),
            "funding_type": validated_data.pop("funding_type"),
        }
        finance_payload = {
            "funding_type": profile_data["funding_type"],
        }
        if profile_data["funding_type"] == StudentProfile.FUNDING_TYPE_BUDGET:
            finance_payload.update(
                {
                    "scholarship_amount": str(validated_data.pop("scholarship_amount")),
                    "scholarship_status": validated_data.pop("scholarship_status"),
                    "next_funding_date": validated_data.pop("next_funding_date").isoformat(),
                }
            )
            validated_data.pop("tuition_amount", None)
            validated_data.pop("current_debt", None)
            validated_data.pop("payment_deadline", None)
        else:
            finance_payload.update(
                {
                    "tuition_amount": str(validated_data.pop("tuition_amount")),
                    "current_debt": str(validated_data.pop("current_debt")),
                    "payment_deadline": validated_data.pop("payment_deadline").isoformat(),
                }
            )
            validated_data.pop("scholarship_amount", None)
            validated_data.pop("scholarship_status", None)
            validated_data.pop("next_funding_date", None)
        password = validated_data.pop("password")

        user = self.Meta.model.objects.create_user(password=password, **validated_data)
        profile = StudentProfile.objects.create(user=user, **profile_data)

        store_registration_finance_payload(user=user, profile=profile, finance_payload=finance_payload)
        create_finance_profile_for_registration(
            user=user,
            profile=profile,
            finance_payload=finance_payload,
        )
        assign_default_chat_memberships(user=user, profile=profile)

        return user
