from rest_framework import serializers
from .models import Premium, User, Bid

class UserSerlializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]

class BidSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ['id', 'premium', 'created_at', 'bid', 'new_price', 'reason', 'cara', 'old_price']        

class PremiumSerlializer(serializers.ModelSerializer):
    user = UserSerlializer()
    bids = BidSerializer(many=True)

    class Meta:
        model = Premium
        fields = '__all__'
