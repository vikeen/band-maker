from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    # account settings
    url(r'^(?P<username>[\w]+)/account/edit$', views.AccountUpdate.as_view(), name='account-edit'),

    # profile
    url(r'^(?P<username>[\w]+)/$', views.ProfileDetail.as_view(), name='profile-detail'),
    url(r'^(?P<username>[\w]+)/songs/$', views.ProfileSongIndex.as_view(), name='profile-songs'),
    url(r'^(?P<username>[\w]+)/skills/$', views.ProfileSkillIndex.as_view(), name='profile-skills'),

    # skills
    # url(r'^(?P<username>[\w]+)/skill/$', views.SkillIndex.as_view(), name='skill_index'),
    # url(r'^(?P<username>[\w]+)/skills/create/$', views.SkillCreate.as_view(), name='skill_create'),
    # url(r'^(?P<username>[\w]+)/skills/(?P<skill_id>[0-9]+)/delete/$', views.SkillDelete.as_view(), name='skill_delete')
]
