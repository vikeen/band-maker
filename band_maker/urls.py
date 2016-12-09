from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth import views as auth_views
from registration.backends.simple import views as registration_views
import home.views

admin.autodiscover()

urlpatterns = [
    url(r'^$', home.views.index, name='index'),
    url(r'^accounts/login', auth_views.login, {'template_name': 'registration/login.html'}, name='login'),
    url(r'^accounts/logout', auth_views.logout, {'template_name': 'registration/logout.html'}, name='logout'),
    url(r'^accounts/registration', registration_views.RegistrationView.as_view(), name='registration'),
    url(r'^songs/', include('songs.urls')),
    url(r'^users/(?P<username>[\w]+)/', include('users.urls')),
    url(r'^admin/', include(admin.site.urls)),
]
