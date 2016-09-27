from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    url(r'^songs/$', views.SongsView.as_view(), name='songs'),
    url(r'^songs/create/$', views.SongCreate.as_view(), name='song_create'),
    url(r'^(?P<pk>[0-9]+)/edit$', views.SongUpdate.as_view(), name='song_update')
]
