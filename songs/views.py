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
from django.shortcuts import redirect
from django.views import generic
from .licenses import license
from .models import Song, Track, TrackRequest
from .mixins import HasAccessToSongMixin, HasAccessToTrack
from tempfile import mkdtemp
from shutil import rmtree


class Index(generic.ListView):
    model = Song
    context_object_name = 'song_list'

    def get_queryset(self):
        requesting_tracks = self.request.GET.get('requesting_tracks')

        if requesting_tracks:
            return Song.objects.filter(published=False, tracks__public=True).distinct("id")
        else:
            return Song.objects.filter(published=True)


class Detail(generic.DetailView):
    model = Song
    context_object_name = 'song'

    def get_context_data(self, **kwargs):
        context = super(Detail, self).get_context_data(**kwargs)
        song = context['song']
        context['tracks'] = song.tracks.all()
        context['tracks_json'] = serializers.serialize('json', context['tracks'])
        return context


class Create(LoginRequiredMixin, generic.CreateView):
    model = Song
    fields = ['title', 'description', 'license']
    template_name = 'songs/song_create.html'

    def get_license_information(self):
        return license[self.license]

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super(Create, self).form_valid(form)

    def get_success_url(self):
        return reverse_lazy('users:songs', kwargs={
            'username': self.request.user
        })


class Delete(LoginRequiredMixin,
             HasAccessToSongMixin,
             generic.DeleteView):
    model = Song
    template_name = 'songs/song_confirm_delete.html'

    def get_success_url(self):
        return reverse_lazy('users:songs', kwargs={
            'username': self.request.user
        })


class Update(LoginRequiredMixin,
             HasAccessToSongMixin,
             generic.UpdateView):
    model = Song
    fields = ["title", 'description', 'license', 'published']
    template_name = 'songs/song_update.html'
    context_object_name = 'song'

    def get_success_url(self):
        return reverse('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })

    def get_context_data(self, **kwargs):
        context = super(Update, self).get_context_data(**kwargs)
        song = context['song']
        context['tracks'] = song.tracks.all()
        context['tracks_json'] = serializers.serialize("json", context['tracks'])

        return context


class TrackCreate(LoginRequiredMixin,
                  HasAccessToSongMixin,
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

        track = form.save()
        song.tracks.add(track)
        song.save()

        return redirect(self.get_success_url())

    def get_context_data(self, **kwargs):
        context = super(TrackCreate, self).get_context_data(**kwargs)
        context['song'] = Song.objects.get(id=self.kwargs['pk'])
        context['song_json'] = serializers.serialize("json", [context['song'], ])
        return context

    def get_success_url(self):
        return reverse_lazy('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })


class TrackDelete(LoginRequiredMixin,
                  HasAccessToTrack,
                  generic.DeleteView):
    model = Track
    template_name = 'songs/track_confirm_delete.html'
    context_object_name = 'track'

    def get_object(self, queryset=None):
        return Track.objects.get(pk=self.kwargs['track_id'])

    def get_context_data(self, **kwargs):
        context = super(TrackDelete, self).get_context_data(**kwargs)
        context['song'] = Song.objects.get(id=self.kwargs['pk'])
        return context

    def get_success_url(self):
        return reverse_lazy('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })


class TrackUpdate(LoginRequiredMixin,
                  HasAccessToTrack,
                  generic.UpdateView):
    model = Track
    fields = ['instrument', 'license', 'public']
    template_name = 'songs/track_update.html'
    context_object_name = 'track'

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

    def get_object(self, queryset=None):
        return Track.objects.get(pk=self.kwargs['track_id'])

    def get_context_data(self, **kwargs):
        context = super(TrackUpdate, self).get_context_data(**kwargs)
        context['song'] = Song.objects.get(pk=self.kwargs['pk'])
        context['track_json'] = serializers.serialize("json", [context['track'], ])
        context['song_json'] = serializers.serialize("json", [context['song'], ])
        return context

    def get_success_url(self):
        return reverse_lazy('songs:edit', kwargs={
            'pk': self.kwargs['pk']
        })


class TrackRequestCreate(LoginRequiredMixin,
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
        form.instance.status = TrackRequest.STATUS['PENDING']
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
        context['song'] = Song.objects.get(pk=self.kwargs['pk'])
        return context

    def get_success_url(self):
        return reverse('songs:detail', kwargs={
            'pk': self.kwargs['pk']
        })


@login_required()
def download_song(request, pk):
    s3_bucket = os.environ.get('S3_BUCKET')
    s3_client = boto3.client('s3')

    song = Song.objects.get(pk=pk)
    downloadable_tracks = song.tracks.exclude(public=True)

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

    logging.info('zip file created name: [%s] at path: [%s]' % (archive_file_name, archive_file_path))
    archive.close()

    with File(open(archive_file_path, 'rb')) as f:
        response = HttpResponse(f.chunks())

    response['Content-Type'] = 'application/zip'
    response['Content-Disposition'] = 'attachment; filename=%s' % archive_file_name

    logging.info('clean up temporary download directory [%s]' % temp_download_dir)

    rmtree(temp_download_dir)

    return response
