from rest_framework import serializers
from ..models import base_models

class CapitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = base_models.Capital
        fields = '__all__'


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = base_models.Asset
        fields = '__all__'


class WalletSerializer(serializers.ModelSerializer):
    history_capital = CapitalSerializer(many=True)
    assets = AssetSerializer(many=True)
    class Meta:
        model = base_models.Wallet
        fields = '__all__'


class FimpleUserSerializer(serializers.ModelSerializer):
    wallet = WalletSerializer()
    class Meta:
        model = base_models.FimpleUser
        fields = '__all__'
        
