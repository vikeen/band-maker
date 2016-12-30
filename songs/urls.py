from django.conf.urls import url

from . import views

app_name = 'songs'
urlpatterns = [
    url(r'^$', views.SongIndex.as_view(), name='index'),
    url(r'^(?P<pk>[0-9]+)/$', views.SongDetail.as_view(), name='detail'),
    url(r'^(?P<pk>[0-9]+)/delete$', views.SongDelete.as_view(), name='delete'),
    url(r'^(?P<pk>[0-9]+)/edit$', views.SongUpdate.as_view(), name='edit'),

    url(r'^(?P<pk>[0-9]+)/download$', views.download_song, name='download'),

    # song create wizard
    url(r'^create$', views.WizardCreate.as_view(), name='wizard_create'),
    url(r'^create/(?P<pk>[0-9]+)/confirm$', views.WizardCreateConfirm.as_view(), name='wizard_create_confirm'),
    url(r'^create/(?P<pk>[0-9]+)/tracks/create$', views.WizardTrackCreate.as_view(),
        name='wizard_track_create'),
    url(r'^create/(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/delete', views.WizardTrackDelete.as_view(),
        name="wizard_track_delete"),
    url(r'^create/(?P<pk>[0-9]+)/contributors/create$', views.WizardContributorCreate.as_view(),
        name='wizard_contributor_create'),
    url(r'^create/(?P<pk>[0-9]+)/contributors/(?P<track_id>[0-9]+)/delete', views.WizardContributorDelete.as_view(),
        name="wizard_contributor_delete"),
    url(r'^create/(?P<pk>[0-9]+)/complete$', views.wizard_complete, name='wizard_complete'),

    # tracks
    url(r'^(?P<pk>[0-9]+)/tracks/create', views.TrackCreate.as_view(), name="track_create"),
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/delete', views.TrackDelete.as_view(),
        name="track_delete"),
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/edit', views.TrackUpdate.as_view(),
        name="track_update"),

    # contributors
    url(r'^(?P<pk>[0-9]+)/contributors/create', views.ContributorCreate.as_view(), name="contributor_create"),
    url(r'^(?P<pk>[0-9]+)/contributors/(?P<track_id>[0-9]+)/edit', views.ContributorUpdate.as_view(),
        name="contributor_update"),
    url(r'^(?P<pk>[0-9]+)/contributors/(?P<track_id>[0-9]+)/delete', views.ContributorDelete.as_view(),
        name="contributor_delete"),

    # track requests
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/requests/create$', views.TrackRequestCreate.as_view(),
        name="track_request_create"),
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/requests/(?P<track_request_id>[0-9]+)$',
        views.TrackRequestDetail.as_view(),
        name="track_request_detail"),
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/requests/(?P<track_request_id>[0-9]+)/approve$',
        views.approve_track_request, name="track_request_approve"),
    url(r'^(?P<pk>[0-9]+)/tracks/(?P<track_id>[0-9]+)/requests/(?P<track_request_id>[0-9]+)/decline$',
        views.decline_track_request, name="track_request_decline")
]
