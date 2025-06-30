from django.urls import path
# Make sure this import points to your views.py file
from home.viewset import TransmitDocumentsAPIView,PostAdditionalDocumentsAPIView
from django.conf import settings
from rest_framework.routers import DefaultRouter, SimpleRouter
from users.api.views import (
    UserViewSet,
    SignupViewSet,
    LoginViewSet,
    verifyOtpView,
    sendOtpView,
    resetEmailView,
    resetPasswordView,
    userProfileView,
    deleteUserView,
)


app_name = "api"

if settings.DEBUG:
    router = DefaultRouter()
else:
    router = SimpleRouter()



router.register("users", UserViewSet)
router.register("signup", SignupViewSet, basename="signup")
router.register("login", LoginViewSet, basename="login")
router.register("verify-otp", verifyOtpView, basename="verify-otp")
router.register("send-otp", sendOtpView, basename="send-otp")
router.register("reset-email", resetEmailView, basename="reset-email")
router.register("reset-password", resetPasswordView, basename="reset-password")
router.register("user-profile", userProfileView, basename="user-profile")
router.register("delete-user", deleteUserView, basename="delete-user")

# We don't use a router for a single APIView.
# Instead, we define the path directly in urlpatterns.
urlpatterns = [
    path("transmit-documents/", TransmitDocumentsAPIView.as_view(), name="transmit-documents"),
    path("additional-documents/", PostAdditionalDocumentsAPIView.as_view(), name="additional-documents"),
]+router.urls
