from django.conf.urls import url

from . import views

app_name = 'songs'
urlpatterns = [
    url(r'^$', views.Index.as_view(), name='index'),
    url(r'^create$', views.Create.as_view(), name='create'),
    url(r'^(?P<pk>[0-9]+)/$', views.Detail.as_view(), name='detail'),
    url(r'^(?P<pk>[0-9]+)/delete$', views.Delete.as_view(), name='delete'),
    url(r'^(?P<pk>[0-9]+)/edit$', views.Update.as_view(), name='edit'),

    url(r'^(?P<pk>[0-9]+)/download$', views.download_song, name='download'),

    # tracks
    url(r'^(?P<pk>[0-9]+)/tracks/create', views.TrackCreate.as_view(), name="track_create"),
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/delete', views.TrackDelete.as_view(),
        name="track_delete"),
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/edit', views.TrackUpdate.as_view(),
        name="track_update"),

    # track requests
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/requests/create', views.TrackRequestCreate.as_view(),
        name="track_request_create")
]
