from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin

from songs.models import Song


class SongsView(generic.ListView):
    template_name = 'users/songs.html'
    context_object_name = 'song_list'

    def get_queryset(self):
        return Song.objects.filter(composer__username=self.kwargs['pk'])


class SongsCreateView(LoginRequiredMixin, generic.CreateView):
    model = Song
    fields = ['title', 'media_url']
    template_name = 'users/song_create.html'

    def form_valid(self, form):
        form.instance.composer = self.request.user
        return super(SongsCreateView, self).form_valid(form)