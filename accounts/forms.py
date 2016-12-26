import re

from django import forms

from django.contrib.auth.models import User

from users.models import Profile
from registration.forms import RegistrationForm as BaseRegistrationForm


class RegistrationForm(BaseRegistrationForm):
    def clean(self):

        username_value = self.cleaned_data.get(User.USERNAME_FIELD)
        if username_value is not None:
            if not re.match(r'^[A-Za-z0-9]+$', username_value):
                self.add_error(User.USERNAME_FIELD, 'A username may only contain letters and numbers')

        super().clean()


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['avatar_url', 'avatar_file_name']
