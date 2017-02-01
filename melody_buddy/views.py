from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse

from users.models import Follower


def index(request):
    return render(request, 'melody_buddy/index.html')


def follow(request):
    email = request.POST.get("email")

    if email and request.method == "POST":
        follower = Follower.objects.filter(email=email)

        if not follower:
            follower = Follower.objects.create(email=email)
            follower.save()

    return redirect(reverse('index') + "?subscribed=true")