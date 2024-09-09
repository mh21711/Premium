from django.shortcuts import render, HttpResponseRedirect, get_object_or_404
from .models import User, Premium, Bid
from django.urls import reverse
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.core.serializers import serialize
import logging
from rest_framework import status, viewsets, generics
from .serializer import PremiumSerlializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import timedelta
from django.utils.timezone import now
from django.utils import timezone

logger = logging.getLogger(__name__)

# Create your views here.
def index(request):
    for premium in Premium.objects.all():
        premium.check_and_update_late()

    if not request.user.is_authenticated:  # Redirect unauthenticated users
        return HttpResponseRedirect(reverse("login"))
    else:
        # Render the index page or another page for authenticated users
        return render(request, "premium/index.html")

def create(request):
    if request.method == "POST":
        user = request.user
        people = request.POST["people"]
        product = request.POST["product"]
        price = request.POST["price"]
        premium = Premium(user=user, people=people, product=product, price=price)
        premium.save()
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "premium/create.html") 

def premium(request, premium_id):
    return render(request, "premium/premium.html") 

def premium_late(request):
    return render(request, "premium/premiums.html")

class ListAPIView(generics.ListAPIView):
    serializer_class = PremiumSerlializer

    def get_queryset(self):
        return Premium.objects.all()

class PremiumView(generics.ListAPIView):
    serializer_class = PremiumSerlializer

    def get_queryset(self):
        id = self.request.query_params.get('id')
        return Premium.objects.filter(id=id)

class DeletePremiumView(viewsets.ViewSet):
    permission_class = [IsAuthenticated]

    def destroy(self, request):
        premiumId = request.data.get("premiumId")
        premium = get_object_or_404(Premium, id=premiumId)
        premium.delete()

        return Response(status=status.HTTP_200_OK) 

class PremiumLateView(generics.ListAPIView):
    serializer_class = PremiumSerlializer 

    def get_queryset(self):
        return Premium.objects.filter(late=True).all()              

class BidsView(viewsets.ViewSet):
    permission_class = [IsAuthenticated]

    def create(self, request):
        premiumId = request.data.get("premiumId")
        bid_price = int(request.data.get("bid", 0))
        reason = request.data.get("reason")
        cara = "+" if reason else "-"

        # Get the premium object
        premium = get_object_or_404(Premium, id=premiumId)

        # Get the latest bid or use the premium price if there are no bids
        latest_bid = premium.bids.last()  # Get the latest bid (assuming bids are ordered)
        old_price = latest_bid.new_price if latest_bid else premium.price

        # Calculate the new price
        new_price = old_price + bid_price if reason else old_price - bid_price

        # Create the bid
        bid = Bid(
            premium=premium,
            bid=bid_price,
            cara=cara,
            new_price=new_price,
            reason=reason or "",
            old_price=old_price  # Set the old price
        )

        try:
            # Save the new bid
            bid.save()

            # Explicitly add the bid to the Premium's bids field
            premium.bids.add(bid)
            premium.save()

            return Response(status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Error saving bid: {e}")
            return Response({"error": "Bid creation failed"}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request):
        bidId = request.data.get("bidId")
        premiumId = request.data.get("premiumId")

        premium = get_object_or_404(Premium, id=premiumId)
        bid = get_object_or_404(Bid, id=bidId)
        premium.bids.remove(bid)

        return Response(status=status.HTTP_200_OK)  
       
class SearchView(generics.ListAPIView):
    serializer_class = PremiumSerlializer  # Use a proper serializer, not a list
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        value = self.request.query_params.get('value', '').lower()  # Get 'value' query param
        if value:
            # Perform a case-insensitive search using __icontains
            return Premium.objects.filter(people__icontains=value)
        return Premium.objects.none()  # Return empty queryset if no value is provided

def register(request):
    if request.method == "POST":
        username = request.POST["username"].lower()  # Convert to lowercase
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        email = request.POST["email"].lower()

        if password != confirmation:
            return render(request, "premium/register.html", {
                "message": "كلمتا المرور يجب ان تتماثلا",
            })

        try:
            with transaction.atomic():
                user = User.objects.create_user(username=username, password=password, email=email)
                user.save()
                logger.debug(f"User created: {user.username} with email: {user.email}")

                user = authenticate(request, username=username, password=password)
                if user is not None:
                    auth_login(request, user)
                    logger.debug(f"User authenticated: {user.username}")
                    return HttpResponseRedirect(reverse('index'))
                else:
                    logger.error(f"Authentication failed for user: {username}")
                    return render(request, "premium/register.html", {
                        "message": "حدث خطأ أثناء محاولة تسجيل الدخول. حاول مرة أخرى",
                    })
        except IntegrityError:
            logger.error(f"IntegrityError: Username {username} already exists.")
            return render(request, "premium/register.html", {
                "message": "اسم المستخدم يوجد بالفعل",
            })
    else:
        return render(request, "premium/register.html")

def login(request):
    if request.method == "POST":
        username = request.POST["username"].lower()
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            return HttpResponseRedirect(reverse('index'))
        else:
            return render(request, "premium/login.html", {
                "message": "كلمة المرور او اسم المستخدم خاطئة",
            })    
    else:        
        return render(request, "premium/login.html")

def logout(request):
    auth_logout(request)
    return HttpResponseRedirect(reverse('index'))        

    