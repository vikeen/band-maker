from django.views import generic
from songs.models import Song


class SongsView(generic.ListView):
    template_name = 'users/songs.html'
    context_object_name = 'published_song_list'

    def get_queryset(self):
        return Song.objects.filter(created_by__username=self.kwargs['username'], published=True)

    def get_context_data(self, **kwargs):
        context = super(SongsView, self).get_context_data(**kwargs)
        context['unpublished_song_list'] = Song.objects.filter(created_by__username=self.kwargs['username'],
                                                               published=False)

        return context
