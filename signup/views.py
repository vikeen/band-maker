from django.shortcuts import render
from django.contrib.auth import login
from django.contrib.auth.models import User

from forms import UserForm


def create(request):
    if request.method == "POST":
        form = UserForm(request.POST)
        if form.is_valid():
            new_user = User.objects.create_user(**form.cleaned_data)
            login(new_user)
            return render(request, 'songs/index.html');
    else:
        form = UserForm()

    return render(request, 'signup/create.html', {
        'form': form
    })
