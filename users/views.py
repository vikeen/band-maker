from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.views import generic
from songs.models import Song
from .models import Skill


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


class SongIndex(generic.DetailView):
    template_name = 'users/user_songs.html'
    context_object_name = 'view_user'

    def get_object(self, queryset=None):
        return User.objects.get(username=self.kwargs['username'])

    def get_context_data(self, **kwargs):
        context = super(SongIndex, self).get_context_data(**kwargs)

        song_list_filter = {
            'created_by__username': self.kwargs['username']
        }

        title = self.request.GET.get('title')

        if title:
            song_list_filter['title__icontains'] = self.request.GET.get('title')

        context['song_list'] = Song.objects.filter(**song_list_filter)

        return context


class SkillIndex(generic.ListView):
    model = Skill
    context_object_name = 'skill_list'
    template_name = 'skill_list'

    def get_queryset(self):
        return Skill.objects.filter(user__username=self.kwargs['username'])


class SkillCreate(generic.CreateView):
    model = Skill
    fields = ['name']
    template_name = 'users/skill_create.html'

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super(SkillCreate, self).form_valid(form)

    def get_success_url(self):
        return reverse('users:skill_index', kwargs={
            'username': self.request.user.username
        })


class SkillDelete(generic.DeleteView):
    model = Song
    template_name = 'users/skill_confirm_delete.html'

    def get_object(self, queryset=None):
        return Skill.objects.get(pk=self.kwargs['skill_id'])

    def get_success_url(self):
        return reverse('users:skill_index', kwargs={
            'username': self.request.user
        })
