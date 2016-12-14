from django.conf.urls import url
from . import views

app_name = 'users'
urlpatterns = [
    url(r'^(?P<username>[\w]+)/$', views.ProfileDetail.as_view(), name='profile_detail'),
    url(r'^(?P<username>[\w]+)/songs/$', views.ProfileSongIndex.as_view(), name='profile_songs'),
    url(r'^(?P<username>[\w]+)/track-requests/$', views.ProfileTrackRequestIndex.as_view(),
        name='profile_track_requests'),
    url(r'^(?P<username>[\w]+)/skills/$', views.ProfileSkillIndex.as_view(), name='profile_skills'),
    url(r'^(?P<username>[\w]+)/contributions/$', views.ContributionIndex.as_view(), name='profile_contributions'),
]
