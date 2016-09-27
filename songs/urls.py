from django.conf.urls import url

from . import views

app_name = 'songs'
urlpatterns = [
    url(r'^$', views.Index.as_view(), name='index'),
    url(r'^upload/$', views.upload),
    url(r'^(?P<pk>[0-9]+)/delete$', views.Delete.as_view(), name='delete'),
    url(r'^(?P<pk>[0-9]+)/$', views.Detail.as_view(), name='detail')
]
