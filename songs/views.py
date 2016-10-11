from django.views import generic
from django.http import JsonResponse
from django.core import serializers
from .models import Song
import os
import boto3


class Index(generic.ListView):
    model = Song
    context_object_name = 'song_list'

    def get_queryset(self):
        return Song.objects.all()


class Detail(generic.DetailView):
    model = Song

    def get_context_data(self, **kwargs):
        context = super(Detail, self).get_context_data(**kwargs)
        song = context['song']
        context['tracks'] = serializers.serialize("json", song.tracks.all())
        return context


def upload(request):
    s3_bucket = os.environ.get('S3_BUCKET')

    file_name = "%s/%s" % (request.user.username, request.GET['file_name'])
    file_type = request.GET['file_type']

    s3 = boto3.client('s3')

    presigned_post = s3.generate_presigned_post(
        Bucket=s3_bucket,
        Key=file_name,
        Fields={"acl": "public-read", "Content-Type": file_type},
        Conditions=[
            {"acl": "public-read"},
            {"Content-Type": file_type}
        ],
        ExpiresIn=3600
    )

    return JsonResponse({
        'data': presigned_post,
        'url': 'https://%s.s3.amazonaws.com/%s' % (s3_bucket, file_name)
    })
