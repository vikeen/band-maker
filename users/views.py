from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.views import generic
from songs.models import Song
from .models import Skill


class ProfileDetail(generic.DetailView):
    model = User
    template_name = 'users/user_detail_overview.html'
    context_object_name = 'view_user'

    def get_object(self, queryset=None):
        return User.objects.get(username=self.kwargs['username'])


class ProfileSongIndex(generic.ListView):
    template_name = 'users/user_detail_song_list.html'
    context_object_name = 'song_list'

    def get_queryset(self):
        song_list_filter = {
            'created_by__username': self.kwargs['username']
        }

        title = self.request.GET.get('title')

        if title:
            song_list_filter['title__icontains'] = self.request.GET.get('title')

        return Song.objects.filter(**song_list_filter)

    def get_context_data(self, **kwargs):
        context = super(ProfileSongIndex, self).get_context_data(**kwargs)
        context['view_user'] = User.objects.get(username=self.kwargs['username'])
        return context


class ProfileSkillIndex(generic.ListView):
    template_name = 'users/user_detail_skill_list.html'
    context_object_name = 'skill_list'

    def get_queryset(self):
        return User.objects.get(username=self.kwargs['username']).skill_set.all()

    def get_context_data(self, **kwargs):
        context = super(ProfileSkillIndex, self).get_context_data(**kwargs)
        context['view_user'] = User.objects.get(username=self.kwargs['username'])
        return context


class AccountProfileUpdate(generic.UpdateView):
    model = User
    fields = ['first_name', 'last_name', 'email']
    template_name = 'users/user_account_profile_update.html'

    def get_object(self, queryset=None):
        return User.objects.get(username=self.request.user.username)

    def get_success_url(self):
        return reverse('users:account_edit', kwargs={
            'username': self.kwargs['username']
        })


class AccountSkillIndex(generic.ListView):
    model = Skill
    context_object_name = 'skill_list'
    template_name = 'users/user_account_skill_list.html'

    def get_queryset(self):
        return Skill.objects.filter(user__username=self.kwargs['username'])


class AccountSkillCreate(generic.CreateView):
    model = Skill
    fields = ['name']
    template_name = 'users/user_account_skill_create.html'

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super(AccountSkillCreate, self).form_valid(form)

    def get_success_url(self):
        return reverse('users:account_skills', kwargs={
            'username': self.request.user.username
        })


class AccountSkillDelete(generic.DeleteView):
    model = Song
    template_name = 'users/user_account_skill_confirm_delete.html'

    def get_object(self, queryset=None):
        return Skill.objects.get(pk=self.kwargs['skill_id'])

    def get_success_url(self):
        return reverse('users:account_skills', kwargs={
            'username': self.request.user
        })
