from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    url(r'^songs/$', views.SongsView.as_view(), name='songs'),
    url(r'^songs/create/$', views.SongCreate.as_view(), name='song_create'),
    url(r'^songs/(?P<pk>[0-9]+)/delete$', views.SongDelete.as_view(), name='song_delete'),
    url(r'^songs/(?P<song_id>[0-9]+)/edit$', views.SongUpdate.as_view(), name='song_update'),

    url(r'^songs/(?P<song_id>[0-9]+)/tracks/create', views.TrackCreate.as_view(), name="track_create"),
    url(r'^songs/(?P<song_id>[0-9]+)/tracks/(?P<track_id>[0-9]+)/edit', views.TrackUpdate.as_view(), name="track_update")
]