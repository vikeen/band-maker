from django.test import TestCase
from django.core.urlresolvers import reverse


class TestSongList(TestCase):
    def test_song_list_loads(self):
        response = self.client.get(reverse("songs:index"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'songs/song_list.html')


class TestSongCreate(TestCase):
    def test_song_create_denies_anonymous(self):
        response = self.client.get(reverse("songs:create"))
        self.assertRedirects(response, '%s/?next=%s' % (reverse('login'), reverse("songs:create")))

    # def test_song_create_loads(self):
    #     self.client.login(username='user', password='test')  # defined in fixture or with factory in setUp()
    #     response = self.client.get(reverse("songs:create"))
    #     self.assertEqual(response.status_code, 200)
    #     self.assertTemplateUsed(response, 'songs/song_create.html')
