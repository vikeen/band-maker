from django.conf.urls import url

from . import views

app_name = 'songs'
urlpatterns = [
    url(r'^$', views.Index.as_view(), name='index'),
    url(r'^(?P<pk>[0-9]+)/$', views.Detail.as_view(), name='detail'),
    url(r'^(?P<pk>[0-9]+)/download$', views.download, name='download'),

    url(r'^(?P<pk>[0-9]+)/tracks/upload/$', views.track_upload, name='track_upload')
]
