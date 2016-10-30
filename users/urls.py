from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    url(r'^songs/$', views.SongsView.as_view(), name='songs')
]
