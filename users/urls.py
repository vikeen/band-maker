from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    url(r'^songs/$', views.SongsView.as_view(), name='songs'),

    url(r'^songs/(?P<song_id>[0-9]+)/tracks/(?P<track_id>[0-9]+)/edit', views.SongTrackUpdate.as_view(),
        name="song_track_update"),
]
