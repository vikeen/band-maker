from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import generic
from users.models import Skill

from .mixins import HasAccessToSkillMixin


class ProfileUpdate(LoginRequiredMixin,
                    generic.UpdateView):
    model = User
    fields = ['first_name', 'last_name', 'email']
    template_name = 'accounts/profile_update.html'

    def get_object(self, queryset=None):
        return User.objects.get(pk=self.request.user.pk)

    def get_success_url(self):
        return reverse('accounts:edit')


class SkillIndex(LoginRequiredMixin,
                 generic.ListView):
    model = Skill
    context_object_name = 'skill_list'
    template_name = 'accounts/skill_list.html'

    def get_queryset(self):
        return Skill.objects.filter(user=self.request.user)


class SkillCreate(LoginRequiredMixin,
                  generic.CreateView):
    model = Skill
    fields = ['name']
    template_name = 'accounts/skill_create.html'

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('accounts:skills')


class SkillDelete(LoginRequiredMixin,
                  HasAccessToSkillMixin,
                  generic.DeleteView):
    model = Skill
    template_name = 'accounts/skill_confirm_delete.html'

    def get_success_url(self):
        return reverse('accounts:skills')
