from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import generic

from .models import Song


class Index(generic.ListView):
    template_name = 'songs/index.html'
    context_object_name = 'song_list'

    def get_queryset(self):
        return Song.objects.all()


class Detail(generic.DetailView):
    model = Song
    template_name = 'songs/detail.html'


class Create(LoginRequiredMixin, generic.CreateView):
    model = Song
    fields = ['title']
    template_name = 'songs/create.html'

    def form_valid(self, form):
        form.instance.composer = self.request.user
        return super(Create, self).form_valid(form)


class Update(LoginRequiredMixin, generic.UpdateView):
    model = Song
    fields = ["title"]
    template_name = 'songs/create.html'