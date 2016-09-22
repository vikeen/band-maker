from django.conf.urls import include, url

from django.contrib import admin
from django.contrib.auth import views as auth_views

admin.autodiscover()

import home.views

urlpatterns = [
    url(r'^$', home.views.index, name='index'),
    url(r'^login/$', auth_views.login, {'template_name': 'login.html'}),
    url(r'^logout/$', auth_views.logout),
    url(r'^signup/$', include('signup.urls')),
    url(r'^songs/', include('songs.urls')),
    url(r'^admin/', include(admin.site.urls)),
]
