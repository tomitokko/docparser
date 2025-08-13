from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import status
from .models import UploadedDocument
import os
import openai
from mistralai import Mistral
from rest_framework.response import Response
import base64
import json
import re
from dotenv import load_dotenv

load_dotenv()


# Create your views here.
class DocumentUploadView(APIView):
    def post(self, request):
        file_obj = request.FILES.get('file')
        description = request.data.get('description', '')

        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        doc = UploadedDocument.objects.create(file=file_obj)

        try:
            extracted_text = self.extract_text_with_mistral(doc.file.path)

            structured_data = self.call_openai_for_structure(extracted_text, description)

            return Response({
                'markdown': extracted_text,
                'data_points': structured_data,
            })
        except Exception as e:
            return Response({'error': f'Processing failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def extract_text_with_mistral(self, file_path):
        try:
            api_key = os.environ.get("MISTRAL_API_KEY")
            if not api_key:
                raise Exception("MISTRAL_API_KEY environment variable not set")

            client = Mistral(api_key=api_key)
            base64_pdf = self.encode_pdf(file_path)
            if not base64_pdf:
                raise Exception("Failed to encode PDF file")

            ocr_response = client.ocr.process(
                model="mistral-ocr-latest",
                document={
                    "type": "document_url",
                    "document_url": f"data:application/pdf;base64,{base64_pdf}" 
                },
                include_image_base64=True
            )

            markdown_content = ""
            if ocr_response.pages:
                for page in ocr_response.pages:
                    if hasattr(page, 'markdown') and page.markdown:
                        markdown_content += page.markdown + "\n\n"

            return markdown_content if markdown_content else "No text extracted from document."
        
        except Exception as e:
            print(f"Mistral OCR error: {e}")
            raise Exception(f"OCR processing failed: {str(e)}")

    def encode_pdf(self, pdf_path):
        """Encode the pdf to base64."""
        try:
            with open(pdf_path, "rb") as pdf_file:
                return base64.b64encode(pdf_file.read()).decode('utf-8')
        except FileNotFoundError:
            print(f"Error: The file {pdf_path} was not found.")
            return None
        except Exception as e:  # Added general exception handling
            print(f"Error: {e}")
            return None

    
    def call_openai_for_structure(self, text, description):
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                raise exception("OPENAI_API_KEY environment variable not set.") 

            client = openai.OpenAI(api_key=api_key)

            prompt = f"""You are a precise data extraction specialist. Based on the following document content and extraction instructions, extract ONLY the requested data points and return them as a JSON array of objects with "field" and "value" properties.

EXTRACTION INSTRUCTIONS:
{description}

DOCUMENT CONTENT:
{text}

IMPORTANT RULES:
1. Return ONLY a JSON array of objects with "field" and "value" properties
2. Each object should have exactly two properties: "field" (string) and "value" (string)
3. Do not include any explanations, markdown, or additional text
4. If a requested field is not found, use "Not found" as the value
5. Be specific with field names based on the users instructions
6. Extract all relevant instances of requested data

Example format:
[
  {{"field":"Invoice Number", "value":"INV-202401"}},
  {{"field":"Date", "value":"2024-15"}},
  {{"field":"Total Amount", "value":"$1,2500"}}
]

Return the JSON array now:
"""
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a precise data extraction assiastant. Return only valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )

            content = response.choices[0].message.content.strip()
            try:
                content = self.clean_json_string(content)
                data_points = json.loads(content.strip())
                if not isinstance(data_points, list):
                    raise ValueError("Response is not a list")

                for item in data_points:
                    if not isinstance(item, dict) or "field" not in item or "value" not in item:
                        raise ValueError("Invalid item structure")

                return data_points
            except Exception as e:
                print(f"Error: {e}")
                print(f"Raw response: {content}")
        except Exception as e:
            print(f"OpenAI API error: {e}")

    def clean_json_string(self, json_str):
        json_str = re.sub(r'\\%', r'\\\\%', json_str)
        
        json_str = re.sub(r'\\(?:[bfnrt])', r'\\\\\\1', json_str)
        
        return json_str
        