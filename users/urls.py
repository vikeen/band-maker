from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    url(r'^(?P<pk>[\w]+)/songs/$', views.SongsView.as_view(), name='songs'),
]
