from django.conf.urls import include, url
from django.contrib import admin
import home.views


admin.autodiscover()


urlpatterns = [
    url(r'^$', home.views.index, name='index'),
    url(r'^accounts/', include('registration.backends.simple.urls')),
    url(r'^songs/', include('songs.urls')),
    url(r'^tracks/', include('tracks.urls')),
    url(r'^users/(?P<username>[\w]+)/', include('users.urls')),
    url(r'^admin/', include(admin.site.urls)),
]
