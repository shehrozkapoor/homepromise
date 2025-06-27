from django.urls import path
# Make sure this import points to your views.py file
from home.viewset import TransmitDocumentsAPIView,PostAdditionalDocumentsAPIView

app_name = "api"

# We don't use a router for a single APIView.
# Instead, we define the path directly in urlpatterns.
urlpatterns = [
    path("transmit-documents/", TransmitDocumentsAPIView.as_view(), name="transmit-documents"),
    path("additional-documents/", PostAdditionalDocumentsAPIView.as_view(), name="additional-documents"),
]