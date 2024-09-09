from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils import timezone
from datetime import timedelta

# Create your models here.
class User(AbstractUser):
    groups = models.ManyToManyField(
        Group,
        related_name='bookstore_user_set',  # Add a custom related_name
        blank=True
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='bookstore_user_set',  # Add a custom related_name
        blank=True
    )

class Premium(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="premium_user")  
    people = models.CharField(max_length=64)
    product = models.CharField(max_length=64, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    bids = models.ManyToManyField("Bid", related_name="premium_bids")
    late = models.BooleanField(default=False)
    price = models.IntegerField()

    def check_and_update_late(self):
        """Set late to True if no bids after 1.5 months, or if no bids and premium created more than 1.5 months ago."""
        time_threshold = timezone.now() - timedelta(days=45)
        
        # Get the last bid
        last_bid = self.bids.order_by('-created_at').first()  # Assuming 'Bid' has a 'created_at' field
        
        # If there are no bids, check if the Premium was created more than 1.5 months ago
        if last_bid is None:
            if self.created_at < time_threshold:
                self.late = True
        # If there are bids, check if the last bid was placed more than 1.5 months ago
        elif last_bid.created_at < time_threshold:
            self.late = True
        
        self.save()

class Bid(models.Model):
    premium = models.ForeignKey("Premium", on_delete=models.CASCADE, related_name="bid_premium")  
    created_at = models.DateTimeField(auto_now_add=True)       # Automatically set on creation
    bid = models.IntegerField()
    new_price = models.IntegerField(null=True, blank=True)
    old_price = models.IntegerField(null=True, blank=True)
    reason = models.CharField(max_length=64, null=True, blank=True)
    cara = models.CharField(max_length=64, null=True, blank=True)
