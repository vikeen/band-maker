from django.conf.urls import url
from django.contrib.auth import views as auth_views
from registration.backends.simple import views as registration_views

from . import views

app_name = 'accounts'
urlpatterns = [
    url(r'^login', auth_views.login, {'template_name': 'accounts/login.html'}, name='login'),
    url(r'^logout', auth_views.logout, {'template_name': 'accounts/logout.html'}, name='logout'),
    url(r'^registration', registration_views.RegistrationView.as_view(), name='registration'),
    url(r'^password/change$', auth_views.password_change,
        {'template_name': 'registration/password_change.html'}, name='password_change'),
    url(r'^edit$', views.ProfileUpdate.as_view(), name='edit'),

    # skills
    url(r'^skills/$', views.SkillIndex.as_view(), name='skills'),
    url(r'^skills/create/$', views.SkillCreate.as_view(), name='skill_create'),
    url(r'^skills/(?P<pk>[0-9]+)/delete/$', views.SkillDelete.as_view(),
        name='skill_delete')
]
