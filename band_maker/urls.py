from django.conf.urls import include, url

from django.contrib import admin
from django.contrib.auth import views as auth_views

admin.autodiscover()

import home.views


urlpatterns = [
    url(r'^$', home.views.index, name='index'),
    url(r'^accounts/', include('registration.backends.simple.urls')),
    url(r'^songs/', include('songs.urls')),
    url(r'^admin/', include(admin.site.urls)),
]
