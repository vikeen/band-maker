from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.views import generic
from songs.models import Song


class Detail(generic.DetailView):
    model = User
    template_name = 'users/user_detail.html'
    context_object_name = 'view_user'

    def get_object(self, queryset=None):
        return User.objects.get(username=self.kwargs['username'])

    def get_context_data(self, **kwargs):
        context = super(Detail, self).get_context_data(**kwargs)
        context['published_song_list'] = Song.objects.filter(created_by__username=self.kwargs['username'],
                                                             published=True)
        context['unpublished_song_list'] = Song.objects.filter(created_by__username=self.kwargs['username'],
                                                               published=False)
        return context


class Update(generic.UpdateView):
    model = User
    fields = ['first_name', 'last_name', 'email']
    template_name = 'users/user_update.html'
    context_object_name = 'view_user'

    def get_object(self, queryset=None):
        return User.objects.get(username=self.kwargs['username'])

    def get_success_url(self):
        return reverse('users:edit', kwargs={
            'username': self.kwargs['username']
        })


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
