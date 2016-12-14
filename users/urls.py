from django.conf.urls import url
from . import views

app_name = 'users'
urlpatterns = [
    url(r'^(?P<username>[\w]+)/$', views.Detail.as_view(), name='detail'),
    url(r'^(?P<username>[\w]+)/songs/$', views.SongIndex.as_view(), name='songs'),
    url(r'^(?P<username>[\w]+)/track-requests/$', views.TrackRequestIndex.as_view(),
        name='track_requests'),
    url(r'^(?P<username>[\w]+)/skills/$', views.SkillIndex.as_view(), name='skills'),
    url(r'^(?P<username>[\w]+)/contributions/$', views.ContributionIndex.as_view(), name='contributions'),
]
