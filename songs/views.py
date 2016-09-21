from django.shortcuts import get_object_or_404, render
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from django.views import generic
from django.utils import timezone

class IndexView(generic.ListView):
    template_name = 'songs/index.html'
    # context_object_name = 'latest_question_list'
    #
    def get_queryset(self):
        # return Question.objects \
        #     .filter(pub_date__lte=timezone.now()) \
        #     .order_by('-pub_date')[:5]
        return []