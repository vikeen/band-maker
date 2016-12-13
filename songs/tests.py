from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.models import User

from .models import Song


class SongTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='user', email='user@gmail.com', password='password')

    def login(self):
        self.client.login(username='user', password='password')


class Index(SongTestCase):
    def test_song_list_loads(self):
        response = self.client.get(reverse("songs:index"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/song_list.html')


class Create(SongTestCase):
    def setUp(self):
        return super(Create, self).setUp()

    def test_song_create_denies_anonymous(self):
        response = self.client.get(reverse("songs:create"))
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), reverse("songs:create")))

    def test_song_create_loads(self):
        super(Create, self).login()
        response = self.client.get(reverse("songs:create"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/song_create.html')

    def test_song_create_submits(self):
        super(Create, self).login()
        response = self.client.post(reverse("songs:create"), {
            'title': 'song title',
            'description': 'song description',
            'license': 'cc-by-4.0'
        })

        song = Song.objects.filter(created_by=self.user).first()

        self.assertRedirects(response, reverse('songs:edit', kwargs={
            'pk': song.pk
        }))
        self.assertEqual(song.title, 'song title')
        self.assertEqual(song.description, 'song description')
        self.assertEqual(song.created_by, self.user)


class Delete(SongTestCase):
    def setUp(self):
        super(Delete, self).setUp()
        self.song = Song.objects.create(title='title', description='description', created_by=self.user)

    def test_song_delete_denies_anonymous(self):
        response = self.client.get(reverse("songs:delete", kwargs={'pk': self.song.pk}))
        next_query_param = reverse('accounts:login'), reverse("songs:delete", kwargs={'pk': self.song.pk})
        self.assertRedirects(response, '%s/?next=%s' % next_query_param)

    def test_song_delete_denies_non_creators(self):
        self.user = User.objects.create_user(
            username='non_creator', email='non_creator@gmail.com', password='password')
        self.client.login(username='non_creator', password='password')

        response = self.client.get(reverse("songs:delete", kwargs={'pk': self.song.pk}))
        self.assertRedirects(response, reverse('songs:detail', kwargs={'pk': self.song.pk}))

    def test_song_delete_submits(self):
        super(Delete, self).login()
        response = self.client.post(reverse('songs:delete', kwargs={'pk': self.song.pk}))

        self.assertRedirects(response, reverse('users:profile_detail', kwargs={
            'username': self.user
        }))

        try:
            Song.objects.get(pk=self.song.pk)
        except ObjectDoesNotExist:
            self.assertRaises(ObjectDoesNotExist)


class Update(SongTestCase):
    def setUp(self):
        super(Update, self).setUp()
        self.song = Song.objects.create(title='song title', description='song description', created_by=self.user)

    def test_song_update_denies_anonymous(self):
        response = self.client.get(reverse("songs:edit", kwargs={'pk': self.song.pk}))
        next_query_param = reverse('accounts:login'), reverse("songs:edit", kwargs={'pk': self.song.pk})
        self.assertRedirects(response, '%s/?next=%s' % next_query_param)

    def test_song_update_denies_non_creators(self):
        self.user = User.objects.create_user(
            username='non_creator', email='non_creator@gmail.com', password='password')
        self.client.login(username='non_creator', password='password')

        response = self.client.get(reverse("songs:edit", kwargs={'pk': self.song.pk}))
        self.assertRedirects(response, reverse('songs:detail', kwargs={'pk': self.song.pk}))

    def test_song_update_submits(self):
        super(Update, self).login()
        response = self.client.post(reverse("songs:edit", kwargs={'pk': self.song.pk}), {
            'title': 'new song title',
            'description': 'new song description',
            'license': 'cc-by-4.0',
            'published': True
        })

        updated_song = Song.objects.get(pk=self.song.pk)

        self.assertRedirects(response, reverse('songs:edit', kwargs={
            'pk': updated_song.pk
        }))
        self.assertEqual(updated_song.title, 'new song title')
        self.assertEqual(updated_song.description, 'new song description')
        self.assertEqual(updated_song.published, True)
        self.assertEqual(updated_song.created_by, self.user)
