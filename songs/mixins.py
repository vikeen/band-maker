import logging

from django.core.urlresolvers import reverse
from django.shortcuts import redirect
from .models import Song


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
                'user: [%s] attempted to access restricted action for song: [%s]' % (self.request.user, song.created_by))
            return redirect(self.get_redirect_url())
