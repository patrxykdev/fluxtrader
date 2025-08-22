from django.db import models
from django.contrib.auth.models import User

class Strategy(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="strategies")
    name = models.CharField(max_length=100)
    configuration = models.JSONField() # This field stores the strategy's logic
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"'{self.name}' by {self.user.username}"