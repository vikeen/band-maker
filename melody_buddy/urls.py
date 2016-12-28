from django.conf.urls import include, url
from django.contrib import admin

import notifications.urls
import home.views

admin.autodiscover()

urlpatterns = [
    url(r'^$', home.views.index, name='index'),
    url(r'^comments/', include('django_comments.urls')),
    url(r'^songs/', include('songs.urls')),
    url(r'^accounts/', include('accounts.urls')),
    url(r'^users/', include('users.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^notifications/', include(notifications.urls, namespace='notifications')),
]
