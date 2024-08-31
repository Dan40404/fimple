from django.urls import path
from .views.base_views import *

urlpatterns = [
    path('login/', Login.as_view()),
    path('login_with_email/', LoginWithEmail.as_view()),
    path('finance/', FinanceView.as_view()),
    path('prediction/', PredictionView.as_view()),

]