from django.conf.urls import url

from . import views

app_name = 'tracks'
urlpatterns = [
    url(r'^upload/$', views.upload)
]
