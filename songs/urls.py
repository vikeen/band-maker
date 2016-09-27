from django.conf.urls import url

from . import views

app_name = 'songs'
urlpatterns = [
    url(r'^$', views.Index.as_view(), name='index'),
    url(r'^create/$', views.Create.as_view(), name='create'),
    url(r'^(?P<pk>[0-9]+)/$', views.Detail.as_view(), name='detail'),
    url(r'^(?P<pk>[0-9]+)/edit$', views.Update.as_view(), name='update')
]
