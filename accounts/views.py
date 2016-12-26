import os
import boto3

from django import forms
from django.core.files.images import get_image_dimensions
from django.core.urlresolvers import reverse
from django.shortcuts import redirect
from django.contrib.auth.models import User
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views import generic
from users.models import Profile, Skill

from .forms import UserProfileForm
from .mixins import HasAccessToSkillMixin


class ProfileUpdate(LoginRequiredMixin,
                    generic.UpdateView):
    model = User
    fields = ['first_name', 'last_name', 'email']
    template_name = 'accounts/profile_update.html'

    def get_object(self, queryset=None):
        return User.objects.get(pk=self.request.user.pk)

    def get_success_url(self):
        messages.success(self.request, 'Your profile has been updated')
        return reverse('accounts:edit')

    def get_context_data(self, **kwargs):
        context = super().get_context_data()

        context['user_profile_form'] = UserProfileForm()
        return context


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
        messages.success(self.request, "Created skill")
        return reverse('accounts:skills')


class SkillDelete(LoginRequiredMixin,
                  HasAccessToSkillMixin,
                  generic.DeleteView):
    model = Skill
    template_name = 'accounts/skill_confirm_delete.html'

    def get_success_url(self):
        messages.success(self.request, "Deleted skill")
        return reverse('accounts:skills')


@login_required
def password_change_done(request):
    messages.success(request, 'Your password has been changed')
    return redirect(reverse('accounts:password_change'))


def password_reset_complete(request):
    messages.success(request, 'Your password has been reset. Please log in with your new password')
    return redirect(reverse('accounts:login'))


@login_required
def avatar_upload(request, **kwargs):
    if request.POST:
        avatar_file = request.FILES.get('avatar')
        user = request.user

        s3_bucket = os.environ.get('S3_BUCKET')
        s3_avatar_bucket_path = '%s/avatars/%s' % (user, avatar_file.name)
        s3_avatar_file_path = 'https://s3-us-west-2.amazonaws.com/%s/%s' % (s3_bucket, s3_avatar_bucket_path)

        form = UserProfileForm({
            'avatar_url': s3_avatar_file_path,
            'avatar_file_name': avatar_file.name
        })

        try:
            form.instance.pk = user.profile.pk
        except Profile.DoesNotExist:
            """
            By catching the error we can safely add the profile primary key when it exists. This will cause the view
            to support inserting and updating the user's profile here
            """
            pass

        form.instance.user = user

        if form.is_valid():
            form.save()

            s3_client = boto3.client('s3')
            s3_client.upload_fileobj(avatar_file, s3_bucket, s3_avatar_bucket_path, ExtraArgs={
                'ACL': 'public-read',
                'ContentType': avatar_file.content_type
            })

            messages.success(request, 'Profile photo uploaded')

        return redirect(reverse('accounts:edit'))
