from django.conf.urls import include, url
from django.contrib import admin

import notifications.urls
from .views import index, follow

admin.autodiscover()

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^follow/', follow, name='follow'),

    url(r'^comments/', include('django_comments.urls')),
    url(r'^songs/', include('songs.urls')),
    url(r'^accounts/', include('accounts.urls')),
    url(r'^users/', include('users.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^notifications/', include(notifications.urls, namespace='notifications')),
]
