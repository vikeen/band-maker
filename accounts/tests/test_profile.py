from django.test import TestCase
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User


class UserTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(first_name='Bob', last_name='Yukon', username='user',
                                             email='user@email.com', password='password')

    def login(self):
        self.client.login(username=self.user.username, password='password')


class ProfileUpdateTestCase(UserTestCase):
    def setUp(self):
        super().setUp()
        self.profile_update_url = reverse("accounts:edit")

    def test_profile_update_denies_anonymous(self):
        response = self.client.get(self.profile_update_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.profile_update_url))

    def test_profile_update_loads(self):
        super().login()
        response = self.client.get(self.profile_update_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'accounts/profile_update.html')

    def test_profile_update_submits(self):
        super().login()
        response = self.client.post(self.profile_update_url, {
            'first_name': 'James',
            'last_name': 'Franco',
            'email': 'james@franco.com'
        })

        update_user = User.objects.get(pk=self.user.pk)

        self.assertRedirects(response, self.profile_update_url)
        self.assertEqual(update_user.first_name, 'James')
        self.assertEqual(update_user.last_name, 'Franco')
        self.assertEqual(update_user.email, 'james@franco.com')
