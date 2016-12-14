from django.contrib.auth.models import User
from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist

from ..models import Song


class SongTestCase(TestCase):
    def setUp(self):
        self.user_creator = User.objects.create_user(
            username='creator',
            email='creator@email.com', password='password')
        self.user_contributor = User.objects.create_user(
            username='contributor', email='contributor@gmail.com', password='password')

    def login(self, user):
        self.client.login(username=user.username, password='password')


class IndexSongTestCase(SongTestCase):
    def test_song_list_loads(self):
        response = self.client.get(reverse("songs:index"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/song_list.html')


class CreateSongTestCase(SongTestCase):
    def setUp(self):
        super().setUp()
        self.create_song_url = reverse("songs:create")

    def test_song_create_denies_anonymous(self):
        response = self.client.get(self.create_song_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.create_song_url))

    def test_song_create_loads(self):
        super().login(self.user_creator)
        response = self.client.get(self.create_song_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/song_create.html')

    def test_song_create_submits(self):
        super().login(self.user_creator)
        response = self.client.post(self.create_song_url, {
            'title': 'song title',
            'description': 'song description',
            'license': 'cc-by-4.0'
        })

        song = Song.objects.filter(created_by=self.user_creator).first()

        self.assertRedirects(response, reverse('songs:edit', kwargs={
            'pk': song.pk
        }))
        self.assertEqual(song.title, 'song title')
        self.assertEqual(song.description, 'song description')
        self.assertEqual(song.created_by, self.user_creator)


class DeleteSongTestCase(SongTestCase):
    def setUp(self):
        super().setUp()
        self.song = Song.objects.create(title='title', description='description', created_by=self.user_creator)
        self.song_delete_url = reverse("songs:delete", kwargs={'pk': self.song.pk})

    def test_song_delete_denies_anonymous(self):
        response = self.client.get(self.song_delete_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.song_delete_url))

    def test_song_delete_denies_non_creators(self):
        super().login(self.user_contributor)

        response = self.client.get(self.song_delete_url)
        self.assertRedirects(response, reverse('songs:detail', kwargs={
            'pk': self.song.pk
        }))

    def test_song_delete_submits(self):
        super().login(self.user_creator)
        response = self.client.post(self.song_delete_url)

        self.assertRedirects(response, reverse('users:profile_detail', kwargs={
            'username': self.user_creator.username
        }))

        try:
            Song.objects.get(pk=self.song.pk)
        except ObjectDoesNotExist:
            self.assertRaises(ObjectDoesNotExist)


class UpdateSongTestCase(SongTestCase):
    def setUp(self):
        super().setUp()
        self.song = Song.objects.create(title='song title', description='song description',
                                        created_by=self.user_creator)
        self.song_update_url = reverse("songs:edit", kwargs={'pk': self.song.pk})

    def test_song_update_denies_anonymous(self):
        response = self.client.get(self.song_update_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.song_update_url))

    def test_song_update_denies_non_creators(self):
        super().login(self.user_contributor)

        response = self.client.get(self.song_update_url)
        self.assertRedirects(response, reverse('songs:detail', kwargs={
            'pk': self.song.pk
        }))

    def test_song_update_submits(self):
        super().login(self.user_creator)
        response = self.client.post(self.song_update_url, {
            'title': 'new song title',
            'description': 'new song description',
            'license': 'cc-by-4.0',
            # 'published': True
        })

        updated_song = Song.objects.get(pk=self.song.pk)

        self.assertRedirects(response, self.song_update_url)
        self.assertEqual(updated_song.title, 'new song title')
        self.assertEqual(updated_song.description, 'new song description')
        # self.assertEqual(updated_song.published, True)
        self.assertEqual(updated_song.created_by, self.user_creator)
