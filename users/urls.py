from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    url(r'^(?P<username>[\w]+)/songs/$', views.SongsView.as_view(), name='songs'),
    url(r'^(?P<username>[\w]+)/$', views.Detail.as_view(), name='detail'),
    url(r'^(?P<username>[\w]+)/edit$', views.Update.as_view(), name='edit')
]
