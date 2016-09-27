from django.views import generic
from django.core.urlresolvers import reverse
from django.contrib.auth.mixins import LoginRequiredMixin

from songs.models import Song


class SongsView(generic.ListView):
    template_name = 'users/songs.html'
    context_object_name = 'song_list'

    def get_queryset(self):
        return Song.objects.filter(composer__username=self.kwargs['username'])


class SongCreate(LoginRequiredMixin, generic.CreateView):
    model = Song
    fields = ['title', 'media_url']
    template_name = 'users/song_create.html'

    def form_valid(self, form):
        form.instance.composer = self.request.user
        return super(SongCreate, self).form_valid(form)


class SongUpdate(LoginRequiredMixin, generic.UpdateView):
    model = Song
    fields = ["title"]
    template_name = 'users/song_update.html'

    def get_success_url(self):
        return reverse('users:song_update', kwargs={
            'username': self.kwargs['username'],
            'pk': self.kwargs['pk']
        })
