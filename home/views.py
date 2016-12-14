from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.core.urlresolvers import reverse
from django.shortcuts import redirect

@login_required
@require_http_methods(['GET'])
def index(request):
    return redirect(reverse('songs:index'))
