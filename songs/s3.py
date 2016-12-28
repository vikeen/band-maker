import os
import boto3


class S3BaseUploadClient:
    bucket = os.environ.get('S3_BUCKET')
    client = boto3.client('s3')
    s3_domain = 'https://s3-us-west-2.amazonaws.com'

    def __init__(self, file_name, file_content_type):
        file_extension = str(file_content_type.split("/")[1])
        self.file_name = str.join(".", (str(file_name), file_extension))
        self.file_content_type = file_content_type

    def get_upload_path(self):
        raise Exception('Override this base method')

    def get_upload_url(self):
        return '%s/%s/%s' % (self.s3_domain, self.bucket, self.get_upload_path())

    def upload_file_obj(self, file_obj):
        self.client.upload_fileobj(file_obj, self.bucket, self.get_upload_path(), ExtraArgs={
            'ACL': 'public-read',
            'ContentType': file_obj.content_type
        })


class S3TrackUploadClient(S3BaseUploadClient):
    def __init__(self, song, file_name, file_content_type):
        self.song = song
        super().__init__(file_name, file_content_type)

    def get_upload_path(self):
        return '%s/songs/%s/tracks/%s' % (self.song.created_by, self.song.uuid, self.file_name)


class S3TrackRequestUploadClient(S3BaseUploadClient):
    def __init__(self, song, file_name, file_content_type):
        self.song = song
        super().__init__(file_name, file_content_type)

    def get_upload_path(self):
        return '%s/songs/%s/requests/%s' % (self.song.created_by, self.song.uuid, self.file_name)
