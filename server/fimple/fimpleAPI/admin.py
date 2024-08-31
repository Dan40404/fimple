from django.contrib import admin
from .models.base_models import *

admin.site.register(FimpleUser)
admin.site.register(Wallet)
admin.site.register(Asset)
admin.site.register(Capital)