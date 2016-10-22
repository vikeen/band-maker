from django.core import serializers
from django.core.urlresolvers import reverse, reverse_lazy
from django.views import generic
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect

from songs.models import Song
from tracks.models import Track


class SongsView(generic.ListView):
    template_name = 'users/songs.html'
    context_object_name = 'song_list'

    def get_queryset(self):
        return Song.objects.filter(created_by__username=self.kwargs['username'])


class SongCreate(LoginRequiredMixin, generic.CreateView):
    model = Song
    fields = ['title', 'description']
    template_name = 'users/song_create.html'

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super(SongCreate, self).form_valid(form)

    def get_success_url(self):
        return reverse_lazy('users:songs', kwargs={
            'username': self.kwargs['username']
        })


class SongUpdate(LoginRequiredMixin, generic.UpdateView):
    model = Song
    fields = ["title", 'description', 'published']
    template_name = 'users/song_update.html'
    context_object_name = 'song'

    def get_object(self, queryset=None):
        return Song.objects.get(pk=self.kwargs['song_id'])

    def get_success_url(self):
        return reverse('users:song_update', kwargs={
            'username': self.kwargs['username'],
            'song_id': self.kwargs['song_id']
        })

    def get_context_data(self, **kwargs):
        context = super(SongUpdate, self).get_context_data(**kwargs)
        song = context['song']
        context['tracks'] = song.tracks.all()
        context['tracks_json'] = serializers.serialize("json", context['tracks'])
        return context


class SongDelete(LoginRequiredMixin, generic.DeleteView):
    model = Song
    template_name = 'users/song_confirm_delete.html'

    def get_success_url(self):
        return reverse_lazy('users:songs', kwargs={
            'username': self.kwargs['username']
        })


class TrackCreate(LoginRequiredMixin, generic.CreateView):
    model = Track
    fields = ['instrument', 'media_url', 'media_name']
    template_name = 'users/track_create.html'

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        track = form.save()
        song = Song.objects.get(pk=self.kwargs['song_id'])
        song.tracks.add(track)
        song.save()

        return redirect(self.get_success_url())

    def get_context_data(self, **kwargs):
        context = super(TrackCreate, self).get_context_data(**kwargs)
        context['song'] = Song.objects.get(id=self.kwargs['song_id'])
        return context

    def get_success_url(self):
        return reverse_lazy('users:song_update', kwargs={
            'username': self.kwargs['username'],
            'song_id': self.kwargs['song_id']
        })


class TrackUpdate(LoginRequiredMixin, generic.UpdateView):
    model = Track
    fields = ['instrument', 'media_url', 'media_name']
    template_name = 'users/track_update.html'
    context_object_name = 'track'

    def get_object(self, queryset=None):
        return Track.objects.get(pk=self.kwargs['track_id'])

    def get_context_data(self, **kwargs):
        context = super(TrackUpdate, self).get_context_data(**kwargs)
        context['song'] = Song.objects.get(id=self.kwargs['song_id'])
        context['track_json'] = serializers.serialize("json", [context['track'], ])
        return context

    def get_success_url(self):
        return reverse_lazy('users:track_update', kwargs={
            'username': self.kwargs['username'],
            'song_id': self.kwargs['song_id'],
            'track_id': self.kwargs['track_id']
        })
