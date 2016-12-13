import zipfile
import os
import boto3
import logging

from django.http import HttpResponse
from django.core import serializers
from django.core.files.base import File
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse, reverse_lazy
from django.db.models import Q
from django.shortcuts import redirect
from django.views import generic
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from .licenses import license
from .models import Song, Track, TrackRequest
from .mixins import HasAccessToSongMixin, HasAccessToTrack, MediaPlayerMixin, SongMixin
from tempfile import mkdtemp
from shutil import rmtree


class Index(generic.ListView):
    model = Song
    context_object_name = 'song_list'

    def get_queryset(self):
        requesting_tracks = self.request.GET.get('requesting_tracks')

        if requesting_tracks:
            return Song.objects.filter(track__public=True).distinct("id")
        else:
            return Song.objects.all()


class Detail(MediaPlayerMixin,
             generic.DetailView):
    model = Song
    context_object_name = 'song'


class Update(LoginRequiredMixin,
             HasAccessToSongMixin,
             MediaPlayerMixin,
             generic.UpdateView):
    model = Song
    fields = ["title", 'description', 'license', 'published']
    template_name = 'songs/song_update.html'
    context_object_name = 'song'

    def get_success_url(self):
        return reverse('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })


class Create(LoginRequiredMixin, generic.CreateView):
    model = Song
    fields = ['title', 'description', 'license']
    template_name = 'songs/song_create.html'
    success_url = ''

    def get_license_information(self):
        return license[self.license]

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super(Create, self).form_valid(form)

    def get_success_url(self):
        return reverse('songs:edit', kwargs={
            'pk': self.object.pk
        })


class Delete(LoginRequiredMixin,
             HasAccessToSongMixin,
             generic.DeleteView):
    model = Song
    template_name = 'songs/song_confirm_delete.html'

    def get_success_url(self):
        return reverse_lazy('users:profile_detail', kwargs={
            'username': self.request.user
        })


class TrackCreate(LoginRequiredMixin,
                  HasAccessToSongMixin,
                  SongMixin,
                  generic.CreateView):
    model = Track
    fields = ['instrument', 'license', 'public']
    template_name = 'songs/track_create.html'

    def form_valid(self, form):
        audio_file = self.request.FILES.get('audio')
        user = self.request.user
        song = Song.objects.get(pk=self.kwargs['pk'])
        requesting_tracks = form.instance.public

        if requesting_tracks:
            form.instance.public = True
            form.instance.audio_url = None
            form.instance.audio_name = None
            form.instance.audio_content_type = None
            form.instance.audio_size = None
        else:
            form.instance.public = False

            if audio_file:
                s3_bucket = os.environ.get('S3_BUCKET')
                s3_client = boto3.client('s3')
                s3_track_file_path = '%s/songs/%s/tracks/%s' % (user, song.uuid, audio_file.name)

                form.instance.audio_url = 'https://s3-us-west-2.amazonaws.com/%s/%s' % (s3_bucket, s3_track_file_path)
                form.instance.audio_name = audio_file.name
                form.instance.audio_content_type = audio_file.content_type
                form.instance.audio_size = audio_file.size

                # TODO: try catch here
                s3_client.upload_fileobj(audio_file, s3_bucket, s3_track_file_path, ExtraArgs={
                    'ACL': 'public-read',
                    'ContentType': audio_file.content_type
                })

        form.instance.created_by = user
        form.instance.song = song

        form.save()

        return redirect(self.get_success_url())

    def get_success_url(self):
        return reverse_lazy('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })


class TrackDelete(LoginRequiredMixin,
                  HasAccessToTrack,
                  SongMixin,
                  generic.DeleteView):
    model = Track
    template_name = 'songs/track_confirm_delete.html'
    context_object_name = 'track'
    pk_url_kwarg = 'track_id'

    def get_success_url(self):
        return reverse_lazy('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })


class TrackUpdate(LoginRequiredMixin,
                  HasAccessToTrack,
                  SongMixin,
                  generic.UpdateView):
    model = Track
    fields = ['instrument', 'license', 'public']
    template_name = 'songs/track_update.html'
    context_object_name = 'track'
    pk_url_kwarg = 'track_id'

    def form_valid(self, form):
        audio_file = self.request.FILES.get('audio')
        user = self.request.user
        song = Song.objects.get(pk=self.kwargs['pk'])
        requesting_tracks = form.instance.public

        if requesting_tracks:
            form.instance.public = True
            form.instance.audio_url = None
            form.instance.audio_name = None
            form.instance.audio_content_type = None
            form.instance.audio_size = None
        else:
            form.instance.public = False

            if audio_file:
                s3_bucket = os.environ.get('S3_BUCKET')
                s3_client = boto3.client('s3')
                s3_track_file_path = '%s/songs/%s/tracks/%s' % (user, song.uuid, audio_file.name)

                form.instance.audio_url = 'https://s3-us-west-2.amazonaws.com/%s/%s' % (s3_bucket, s3_track_file_path)
                form.instance.audio_name = audio_file.name
                form.instance.audio_content_type = audio_file.content_type
                form.instance.audio_size = audio_file.size

                # TODO: try catch here
                s3_client.upload_fileobj(audio_file, s3_bucket, s3_track_file_path, ExtraArgs={
                    'ACL': 'public-read',
                    'ContentType': audio_file.content_type
                })

        form.instance.created_by = user

        return super(TrackUpdate, self).form_valid(form)

    def get_context_data(self, **kwargs):
        context = super(TrackUpdate, self).get_context_data(**kwargs)
        context['track_json'] = serializers.serialize("json", [context['track'], ])
        return context

    def get_success_url(self):
        return reverse_lazy('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })


class TrackRequestCreate(LoginRequiredMixin,
                         SongMixin,
                         generic.CreateView):
    model = TrackRequest
    fields = []
    template_name = 'songs/track_request_create.html'

    def form_valid(self, form):
        audio_file = self.request.FILES.get('audio')
        user = self.request.user
        song = Song.objects.get(pk=self.kwargs['pk'])

        s3_bucket = os.environ.get('S3_BUCKET')
        s3_client = boto3.client('s3')
        s3_track_file_path = '%s/songs/%s/requests/%s' % (user, song.uuid, audio_file.name)

        form.instance.audio_url = 'https://s3-us-west-2.amazonaws.com/%s/%s' % (s3_bucket, s3_track_file_path)
        form.instance.audio_name = audio_file.name
        form.instance.audio_content_type = audio_file.content_type
        form.instance.audio_size = audio_file.size
        form.instance.created_by = user
        form.instance.track_id = self.kwargs['track_id']

        # TODO: try catch here
        s3_client.upload_fileobj(audio_file, s3_bucket, s3_track_file_path, ExtraArgs={
            'ACL': 'public-read',
            'ContentType': audio_file.content_type
        })

        form.save()

        return redirect(self.get_success_url())

    def get_context_data(self, **kwargs):
        context = super(TrackRequestCreate, self).get_context_data(**kwargs)
        context['track'] = Track.objects.get(pk=self.kwargs['track_id'])
        return context

    def get_success_url(self):
        return reverse('songs:detail', kwargs={
            'pk': self.kwargs['pk']
        })


class TrackRequestDetail(LoginRequiredMixin,
                         SongMixin,
                         generic.DetailView):
    model = TrackRequest
    template_name = 'songs/track_request_detail.html'
    context_object_name = 'track_request'
    pk_url_kwarg = 'track_request_id'

    def get_context_data(self, **kwargs):
        context = super(TrackRequestDetail, self).get_context_data(**kwargs)

        # only grab confirmed tracks and the track which is being viewed for a request
        context['tracks'] = context['song'].track_set.filter(Q(public=False) | Q(pk=self.kwargs['track_id']))
        context['tracks_json'] = serializers.serialize("json", context['tracks'])
        context['track_request_json'] = serializers.serialize("json", [context['track_request'], ])
        return context


@login_required()
@require_http_methods(["POST"])
@csrf_protect
def approve_track_request(request, *args, **kwargs):
    track_request = TrackRequest.objects.get(pk=kwargs['track_request_id'])
    track = track_request.track

    # TODO: move s3 resource as well
    track.audio_content_type = track_request.audio_content_type
    track.audio_name = track_request.audio_name
    track.audio_size = track_request.audio_size
    track.audio_url = track_request.audio_url
    track.public = False
    track.created_by = track_request.created_by
    track.save()

    track_request.status = 'approved'
    track_request.save()

    return redirect(reverse('songs:track_request_detail', kwargs=kwargs))


@login_required()
@require_http_methods(["POST"])
@csrf_protect
def decline_track_request(request, *args, **kwargs):
    track_request = TrackRequest.objects.get(pk=kwargs['track_request_id'])

    track_request.status = 'declined'
    track_request.save()

    return redirect(reverse('users:profile_track_requests', kwargs={
        'username': request.user.username
    }))


@login_required()
@require_http_methods(["GET"])
def download_song(request, pk):
    s3_bucket = os.environ.get('S3_BUCKET')
    s3_client = boto3.client('s3')

    song = Song.objects.get(pk=pk)
    downloadable_tracks = song.track_set.exclude(public=True)

    temp_download_dir = mkdtemp()

    archive_file_name = '%s.zip' % song.title
    archive_file_path = '%s/%s' % (temp_download_dir, archive_file_name)

    archive = zipfile.ZipFile(archive_file_path, 'w')

    logging.info('download song: [%s] with title: [%s]' % (song.id, song.title))

    for track in downloadable_tracks:
        s3_track_file_path = '%s/songs/%s/tracks/%s' % (song.created_by, song.uuid, track.audio_name)
        temp_download_file_path = os.path.join(temp_download_dir, track.audio_name)
        logging.info('downloading track [%s] to [%s]' % (s3_track_file_path, temp_download_file_path))

        s3_client.download_file(
            Bucket=s3_bucket,
            Key=s3_track_file_path,
            Filename=temp_download_file_path)

        archive.write(temp_download_file_path, track.audio_name)

    # add license to the download zip
    archive.writestr('LICENSE.txt', license[song.license]['text'])

    logging.info('zip file created name: [%s] at path: [%s]' % (archive_file_name, archive_file_path))
    archive.close()

    with File(open(archive_file_path, 'rb')) as f:
        response = HttpResponse(f.chunks())

    response['Content-Type'] = 'application/zip'
    response['Content-Disposition'] = 'attachment; filename=%s' % archive_file_name

    logging.info('clean up temporary download directory [%s]' % temp_download_dir)

    rmtree(temp_download_dir)

    return response
