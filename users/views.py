from django.views import generic

from songs.models import Song


class SongsView(generic.ListView):
    template_name = 'users/songs.html'
    context_object_name = 'song_list'

    def get_queryset(self):
        return Song.objects.filter(composer__username=self.kwargs['pk'])