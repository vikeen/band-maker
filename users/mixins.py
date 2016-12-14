import logging

from django.views.generic.base import ContextMixin
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.shortcuts import redirect

from songs.models import TrackRequest


class ProfileMixin(ContextMixin):
    def get_context_data(self, **kwargs):
        context = super(ProfileMixin, self).get_context_data(**kwargs)
        user = User.objects.get(username=self.kwargs['username'])

        context['view_user'] = user
        context['pending_track_request_count'] = TrackRequest.objects.filter(
            track__created_by=user, status='pending').count()
        context['skill_count'] = user.skill_set.count()
        context['song_count'] = user.song_set.count()
        return context


class HasAccessToRestrictedUserProfile(object):
    def get_redirect_url(self):
        return reverse('users:detail', kwargs={
            'username': self.kwargs['username']
        })

    def dispatch(self, *args, **kwargs):
        if kwargs['username'] == self.request.user.username:
            return super().dispatch(*args, **kwargs)
        else:
            logging.warning(
                'user: [%s] attempted to access restricted area for user, [%s]' % (
                    self.request.user, kwargs['username']))
            return redirect(self.get_redirect_url())
