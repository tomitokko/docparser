from rest_framework import serializers
from .models import UploadedDocument

class UploadedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedDocument
        field = ['id', 'file', 'uploaded_at']