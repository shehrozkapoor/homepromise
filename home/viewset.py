import json
from pathlib import Path
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Assuming the functions from the Canvas are saved in a file
# named 'VAAPI.py' inside a 'home' app.
# Adjust the import path based on your project structure.
from .VAAPI import get_assertion_private_key, get_access_token, transmit_documents

class TransmitDocumentsAPIView(APIView):
    """
    API endpoint that receives loan document data from the Next.js form,
    authenticates with the VA API, and transmits the documents.
    """

    def post(self, request, *args, **kwargs):
        """
        Handles the POST request from the frontend.
        """
        # 1. Get the data from the request body sent by the Next.js form
        data = request.data
        loan_identifier = data.get('loanIdentifier')
        loan_review_package_file = data.get('loanReviewPackageFile')
        xml_ucd_base64 = data.get('xmlUCDBase64')
        xml_ulad_base64 = data.get('xmlULADBase64')
        filename = data.get('filename')
        
        # Basic validation to ensure all required fields are present
        if not all([loan_identifier, loan_review_package_file, xml_ucd_base64, xml_ulad_base64, filename]):
            return Response(
                {"error": "Missing required fields in the request body."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- IMPORTANT: Path to your private key ---
        # This builds the full, absolute path to your private key file,
        # which should be located in the root of your Django project.
        try:
            client_assertion = get_assertion_private_key()
            token_data = get_access_token(client_assertion=client_assertion)
            access_token = token_data.get("access_token")

            if not access_token:
                return Response(
                    {"error": "Failed to retrieve access token from VA API."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Step 2c: Prepare the payload for the documents API
            documents_payload = {
                "loanIdentifier": loan_identifier,
                "loanReviewPackageFile": loan_review_package_file,
                "xmlUCDBase64": xml_ucd_base64,
                "xmlULADBase64": xml_ulad_base64,
                "filename": filename
            }
            api_response = transmit_documents(access_token, documents_payload,True)
            
            return Response(api_response, status=status.HTTP_200_OK)
        except Exception as e:
            # General error handler for other issues (e.g., network errors, API errors)
            # In production, you would want more specific logging and error handling.
            return Response(
                {"error": "An unexpected error occurred.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            

class PostAdditionalDocumentsAPIView(APIView):
    """
    API endpoint that receives ONLY additional documents for an existing loan.
    """
    def post(self, request, *args, **kwargs):
        data = request.data
        # Explicitly get all expected fields from the request body
        loan_identifier = data.get('loanIdentifier')
        xml_ucd_base64 = data.get('xmlUCDBase64')
        xml_ulad_base64 = data.get('xmlULADBase64')
        additional_documents = data.get('additionalDocuments', [])

        # This view expects a different payload structure
        if not all([loan_identifier, xml_ucd_base64, xml_ulad_base64, additional_documents]):
            return Response(
                {"error": "Missing required fields for an additional documents submission."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client_assertion = get_assertion_private_key()
            token_data = get_access_token(client_assertion=client_assertion)
            access_token = token_data.get("access_token")

            if not access_token:
                return Response(
                    {"error": "Failed to retrieve access token from VA API."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            # Explicitly construct the payload to be sent to the API function
            payload = {
                "loanIdentifier": loan_identifier,
                "xmlUCDBase64": xml_ucd_base64,
                "xmlULADBase64": xml_ulad_base64,
                "additionalDocuments": additional_documents
            }
            
            api_response = transmit_documents(access_token, payload)
            
            return Response(api_response, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred during additional document submission.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )