import zipfile
import os
import boto3

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
    tracks = song.tracks.all()

    temp_download_dir = mkdtemp()

    archive_file_name = '%s.zip' % song.title
    archive_file_path = '%s/%s' % (temp_download_dir, archive_file_name)
    archive = zipfile.ZipFile(archive_file_path, 'w')

    try:

        print 'download song: [%s] with title: [%s]' % (song.id, song.title)

        for track in tracks:
            s3_track_file_path = '%s/tracks/%s' % (song.created_by, track.media_name)
            temp_download_file_path = '%s/%s' % (temp_download_dir, track.media_name)

            print 'downloading track [%s] to [%s]' % (s3_track_file_path, temp_download_file_path)

            s3_client.download_file(
                Bucket=s3_bucket,
                Key=s3_track_file_path,
                Filename=temp_download_file_path)

            archive.write(temp_download_file_path, track.media_name)

        print 'zip file created name: [%s] at path: [%s]' % (archive_file_name, archive_file_path)
    except:
        rmtree(temp_download_dir)
    finally:
        print 'zip file creation complete'
        archive.close()

    with File(open(archive_file_path, 'rb')) as f:
        response = HttpResponse(f.chunks())

    print 'clean up temporary download directory [%s]' % temp_download_dir

    rmtree(temp_download_dir)

    response['Content-Type'] = 'application/zip'
    response['Content-Disposition'] = 'attachment; filename=%s' % archive_file_name

    return response
