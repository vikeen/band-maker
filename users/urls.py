from django.conf.urls import url

from . import views

app_name = 'users'
urlpatterns = [
    url(r'^(?P<username>[\w]+)/songs/$', views.SongView.as_view(), name='songs'),
    url(r'^(?P<username>[\w]+)/$', views.Detail.as_view(), name='detail'),
    url(r'^(?P<username>[\w]+)/edit$', views.Update.as_view(), name='edit'),

    # skills
    url(r'^(?P<username>[\w]+)/skill/$', views.SkillIndex.as_view(), name='skill_index'),
    url(r'^(?P<username>[\w]+)/skills/create/$', views.SkillCreate.as_view(), name='skill_create'),
    url(r'^(?P<username>[\w]+)/skills/(?P<skill_id>[0-9]+)/delete/$', views.SkillDelete.as_view(), name='skill_delete')
]
