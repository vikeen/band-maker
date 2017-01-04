from django.shortcuts import render


def index(request):
    return render(request, 'melody_buddy/index.html')
