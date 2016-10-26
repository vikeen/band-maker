import zipfile
import os
import boto3
import logging

from django.views import generic
from django.http import HttpResponse
from django.core import serializers
from django.core.files.base import File

from .models import Song
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


def download(request, pk):
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
        s3_track_file_path = '%s/tracks/%s' % (song.created_by, track.media_name)
        temp_download_file_path = os.path.join(temp_download_dir, track.media_name)
        logging.info('downloading track [%s] to [%s]' % (s3_track_file_path, temp_download_file_path))

        s3_client.download_file(
            Bucket=s3_bucket,
            Key=s3_track_file_path,
            Filename=temp_download_file_path)

        archive.write(temp_download_file_path, track.media_name)

    logging.info('zip file created name: [%s] at path: [%s]' % (archive_file_name, archive_file_path))
    archive.close()

    with File(open(archive_file_path, 'rb')) as f:
        response = HttpResponse(f.chunks())

    response['Content-Type'] = 'application/zip'
    response['Content-Disposition'] = 'attachment; filename=%s' % archive_file_name

    logging.info('clean up temporary download directory [%s]' % temp_download_dir)

    rmtree(temp_download_dir)

    return response
