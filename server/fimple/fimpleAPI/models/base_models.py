from django.db import models
import uuid
from django.contrib.auth.hashers import make_password


class Capital(models.Model):
    amount = models.FloatField()
    date = models.DateTimeField(auto_now_add=True)


class Asset(models.Model):
    symbol = models.TextField(max_length=10)
    amount = models.FloatField(default=0)
    original_price = models.FloatField(default=0)
    state = models.TextField(max_length=10, default="HOLD") #HOLD, SOLD
    transaction_amount = models.FloatField(default=0, blank=True, null=True)
    transaction_date = models.TextField(max_length=100, blank=True, null=True)


class Wallet(models.Model):
    history_capital = models.ManyToManyField(Capital)
    assets = models.ManyToManyField(Asset)


class FimpleUser(models.Model):
    email = models.EmailField()
    name = models.TextField(max_length=100, blank=True, null=True)
    token = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    password = models.TextField(max_length=100)
    wallet = models.OneToOneField(Wallet, on_delete=models.CASCADE, blank=True, null=True)

    def set_password(self, password):
        new_password = make_password(password)
        return new_password

