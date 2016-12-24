from django.conf.urls import url
from django.core.urlresolvers import reverse_lazy
from django.contrib.auth import views as auth_views
from registration.backends.simple import views as registration_views

from . import views
from . import forms

app_name = 'accounts'
urlpatterns = [
    # authentication
    url(r'^login', auth_views.login, {'template_name': 'accounts/login.html'}, name='login'),
    url(r'^logout', auth_views.logout, {'template_name': 'accounts/logout.html'}, name='logout'),
    url(r'^registration', registration_views.RegistrationView.as_view(
        form_class=forms.RegistrationForm
    ), name='registration'),

    # password
    url(r'^password/change/$', auth_views.password_change, {
        'template_name': 'accounts/password_change.html',
        'post_change_redirect': reverse_lazy('accounts:password_change_done')
    }, name='password_change'),
    url(r'^password/change/done/$', views.password_change_done, name='password_change_done'),
    url(r'^password/reset/$', auth_views.password_reset, {
        'template_name': 'accounts/password_reset_form.html',
        'email_template_name': 'accounts/password_reset_email.html',
        'post_reset_redirect': reverse_lazy('accounts:password_reset_done')
    }, name='password_reset'),
    url(r'^password/reset/done', auth_views.password_reset_done, {
        'template_name': 'accounts/password_reset_done.html',
    }, name='password_reset_done'),
    url(r'^password/reset/confirm/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$',
        auth_views.password_reset_confirm, {
            'template_name': 'accounts/password_reset_confirm.html',
            'post_reset_redirect': reverse_lazy('accounts:password_reset_complete')
        }, name='password_reset_confirm'),
    url(r'^password/reset/complete', views.password_reset_complete, name='password_reset_complete'),

    # account
    url(r'^edit$', views.ProfileUpdate.as_view(), name='edit'),
    url(r'^skills/$', views.SkillIndex.as_view(), name='skills'),
    url(r'^skills/create/$', views.SkillCreate.as_view(), name='skill_create'),
    url(r'^skills/(?P<pk>[0-9]+)/delete/$', views.SkillDelete.as_view(),
        name='skill_delete')
]
