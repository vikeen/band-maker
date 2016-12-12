from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    # account settings
    url(r'^(?P<username>[\w]+)/account/edit$', views.AccountProfileUpdate.as_view(), name='account_edit'),
    url(r'^(?P<username>[\w]+)/account/skills/$', views.AccountSkillIndex.as_view(), name='account_skills'),
    url(r'^(?P<username>[\w]+)/account/skills/create/$', views.AccountSkillCreate.as_view(), name='skill_create'),
    url(r'^(?P<username>[\w]+)/account/skills/(?P<skill_id>[0-9]+)/delete/$', views.AccountSkillDelete.as_view(), name='skill_delete'),

    # profile
    url(r'^(?P<username>[\w]+)/$', views.ProfileDetail.as_view(), name='profile_detail'),
    url(r'^(?P<username>[\w]+)/songs/$', views.ProfileSongIndex.as_view(), name='profile_songs'),
    url(r'^(?P<username>[\w]+)/track-requests/$', views.ProfileTrackRequestIndex.as_view(), name='profile_track_requests'),
    url(r'^(?P<username>[\w]+)/skills/$', views.ProfileSkillIndex.as_view(), name='profile_skills'),
]
