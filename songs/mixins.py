import logging

from django.core.urlresolvers import reverse
from django.shortcuts import redirect
from .models import Song, Track


class HasAccessToSongMixin(object):
    def get_redirect_url(self):
        return reverse('songs:detail', kwargs={
            'pk': self.kwargs['pk']
        })

    def dispatch(self, *args, **kwargs):
        song = Song.objects.get(pk=self.kwargs['pk'])

        if song.created_by == self.request.user:
            return super(HasAccessToSongMixin, self).dispatch(*args, **kwargs)
        else:
            logging.warning(
                'user: [%s] attempted to access restricted action for song: [%s]' % (
                self.request.user, song.created_by))
            return redirect(self.get_redirect_url())


class HasAccessToTrack(object):
    def get_redirect_url(self):
        return reverse('songs:detail', kwargs={
            'pk': self.kwargs['pk']
        })

    def dispatch(self, *args, **kwargs):
        track = Track.objects.get(pk=self.kwargs['track_id'])

        if track.created_by == self.request.user:
            return super(HasAccessToTrack, self).dispatch(*args, **kwargs)
        else:
            logging.warning(
                'user: [%s] attempted to access restricted action for track: [%s]' % (
                self.request.user, track.created_by))
            return redirect(self.get_redirect_url())
