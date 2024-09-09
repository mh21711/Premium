from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("logout/", views.logout, name="logout"),
    path("create/", views.create, name="create"),
    path("premium/<int:premium_id>", views.premium, name="premium"),
    path('premiums_late', views.premium_late, name="premium_late"),

    # API URLS
    path('api/premiums/', views.ListAPIView.as_view(), name='api_premium'),
    path('api/premium/', views.PremiumView.as_view(), name="api_premium_one"),
    path('api/bids/', views.BidsView.as_view({'post': 'create', 'delete': 'destroy'}), name="api_bids"),
    path('api/search/', views.SearchView.as_view(), name="api_search"),
    path('api/premium/delete', views.DeletePremiumView.as_view({'delete': 'destroy'}), name="api_premium_delete"),
    path("api/premiums/late", views.PremiumLateView.as_view(), name="api_premiums_late"),
]