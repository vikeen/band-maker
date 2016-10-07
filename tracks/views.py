from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
import os
import boto3


@login_required
def upload(request):
    s3_bucket = os.environ.get('S3_BUCKET')

    file_name = "%s/tracks/%s" % (request.user.username, request.GET['file_name'])
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
