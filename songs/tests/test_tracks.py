from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist

from ..models import Song, SongStats, Track
from .test_songs import SongTestCase


class TrackTestCase(SongTestCase):
    def setUp(self):
        super().setUp()
        self.song = Song.objects.create(
            title='song title',
            description='song description',
            created_by=self.user_creator)

        SongStats.objects.create(song=self.song)


class CreateTrackTestCase(TrackTestCase):
    def setUp(self):
        super().setUp()
        self.create_track_url = reverse("songs:track_create", kwargs={'pk': self.song.pk})

    def test_track_create_denies_anonymous(self):
        response = self.client.get(self.create_track_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.create_track_url))

    def test_track_create_loads(self):
        super().login(self.user_creator)
        response = self.client.get(self.create_track_url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/track_create.html')

    def test_track_create_submits_public(self):
        super().login(self.user_creator)
        response = self.client.post(self.create_track_url, {
            'instrument': 'guitar_electric',
            'public': True,
            'license': 'cc-by-4.0'
        })

        track = Track.objects.filter(created_by=self.user_creator).first()

        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('songs:edit', kwargs={
            'pk': self.song.pk
        }))
        self.assertEqual(track.public, True)
        self.assertEqual(track.audio_url, None)
        self.assertEqual(track.audio_name, None)
        self.assertEqual(track.audio_content_type, None)
        self.assertEqual(track.audio_size, None)


class DeleteTrackTestCase(TrackTestCase):
    def setUp(self):
        super().setUp()
        self.track = Track.objects.create(
            instrument="guitar_electric",
            audio_url="file/path",
            audio_name="track.mp3",
            audio_size=1024,
            audio_content_type="audio/mp3",
            created_by=self.user_creator,
            song=self.song)
        self.track_delete_url = reverse("songs:track_delete", kwargs={
            'pk': self.song.pk,
            'track_id': self.track.pk
        })

    def test_track_delete_denies_anonymous(self):
        response = self.client.get(self.track_delete_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.track_delete_url))

    def test_track_delete_denies_non_creators(self):
        super().login(self.user_contributor)

        response = self.client.get(self.track_delete_url)
        self.assertRedirects(response, reverse('songs:detail', kwargs={'pk': self.song.pk}))

    def test_track_delete_loads(self):
        super().login(self.user_creator)
        response = self.client.get(self.track_delete_url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/track_confirm_delete.html')

    def test_track_delete_submits(self):
        super().login(self.user_creator)
        response = self.client.post(self.track_delete_url)

        self.assertRedirects(response, reverse('songs:edit', kwargs={
            'pk': self.song.pk
        }))

        try:
            Track.objects.get(pk=self.track.pk)
        except ObjectDoesNotExist:
            self.assertRaises(ObjectDoesNotExist)


class UpdateTrackTestCase(TrackTestCase):
    def setUp(self):
        super().setUp()
        self.track = Track.objects.create(
            instrument="guitar_electric",
            audio_url="file/path",
            audio_name="track.mp3",
            audio_size=1024,
            audio_content_type="audio/mp3",
            created_by=self.user_creator,
            public=False,
            song=self.song)
        self.track_update_url = reverse("songs:track_update", kwargs={
            'pk': self.song.pk,
            'track_id': self.track.pk
        })

    def test_track_update_denies_anonymous(self):
        response = self.client.get(self.track_update_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse("accounts:login"), self.track_update_url))

    def test_track_update_denies_non_creators(self):
        super().login(self.user_contributor)

        response = self.client.get(self.track_update_url)
        self.assertRedirects(response, reverse('songs:detail', kwargs={'pk': self.song.pk}))

    def test_track_update_loads(self):
        super().login(self.user_creator)
        response = self.client.get(self.track_update_url)

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/track_update.html')

    def test_track_update_submits_to_public(self):
        super().login(self.user_creator)
        response = self.client.post(self.track_update_url, {
            'instrument': 'guitar_acoustic',
            'public': True,
            'license': 'cc-by-4.0'
        })

        updated_track = Track.objects.get(pk=self.track.pk)

        self.assertEqual(updated_track.instrument, 'guitar_acoustic')
        self.assertEqual(updated_track.public, True)
        self.assertEqual(updated_track.audio_url, None)
        self.assertEqual(updated_track.audio_name, None)
        self.assertEqual(updated_track.audio_content_type, None)
        self.assertEqual(updated_track.audio_size, None)
        self.assertRedirects(response, reverse('songs:edit', kwargs={
            'pk': self.song.pk
        }))
