from django.views import generic

from .models import Song

class IndexView(generic.ListView):
    template_name = 'songs/index.html'
    context_object_name = 'song_list'

    def get_queryset(self):
        return Song.objects.all()

class DetailView(generic.DetailView):
    model = Song
    template_name = 'songs/detail.html'
