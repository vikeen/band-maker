import logging

from django.core.urlresolvers import reverse
from django.shortcuts import redirect

from users.models import Skill


class HasAccessToSkillMixin(object):
    def get_redirect_url(self):
        return reverse('accounts:edit')

    def dispatch(self, *args, **kwargs):
        skill = Skill.objects.get(pk=kwargs['pk'])

        if skill.user == self.request.user:
            return super().dispatch(*args, **kwargs)
        else:
            logging.warning(
                'user: [%s] attempted to access restricted action for skill: [%s]' % (
                    self.request.user, skill.user))
            return redirect(self.get_redirect_url())
