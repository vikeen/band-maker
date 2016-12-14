from django.test import TestCase
from django.core.urlresolvers import reverse
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.contrib.auth.models import User

from users.models import Skill


class UserTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(first_name='Bob', last_name='Yukon', username='user',
                                             email='user@email.com', password='password')

    def login(self):
        self.client.login(username=self.user.username, password='password')


class SkillsIndexTestCase(UserTestCase):
    def setUp(self):
        super().setUp()
        self.skills_index_url = reverse("accounts:skills")

    def test_skill_index_denies_anonymous(self):
        response = self.client.get(self.skills_index_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.skills_index_url))

    def test_skill_index_loads(self):
        super().login()
        response = self.client.get(self.skills_index_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'accounts/skill_list.html')


class CreateSkillTestCase(UserTestCase):
    def setUp(self):
        super().setUp()
        self.create_skill_url = reverse("accounts:skill_create")

    def test_skill_create_denies_anonymous(self):
        response = self.client.get(self.create_skill_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.create_skill_url))

    def test_skill_create_loads(self):
        super().login()
        response = self.client.get(self.create_skill_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'accounts/skill_create.html')

    def test_skill_create_submits(self):
        super().login()
        response = self.client.post(self.create_skill_url, {
            'name': 'lead_guitar'
        })

        skill = Skill.objects.filter(user=self.user).first()

        self.assertRedirects(response, reverse('accounts:skills'))
        self.assertEquals(skill.name, 'lead_guitar')

    def test_skill_create_denies_invalid_name(self):
        super().login()
        self.client.post(self.create_skill_url, {
            'name': 'invalid'
        })

        self.assertRaises(ValidationError)


class DeleteSkillTestCase(UserTestCase):
    def setUp(self):
        super().setUp()
        self.skill = Skill.objects.create(name='lead_guitar', user=self.user)
        self.delete_skill_url = reverse("accounts:skill_delete", kwargs={
            'pk': self.skill.pk
        })

    def test_skill_delete_denies_anonymous(self):
        response = self.client.get(self.delete_skill_url)
        self.assertRedirects(response, '%s/?next=%s' % (reverse('accounts:login'), self.delete_skill_url))

    def test_skill_delete_denies_non_owner(self):
        user = User.objects.create_user(username='dummy', email='test@test.com', password='password')
        self.client.login(username=user.username, password='password')

        response = self.client.get(self.delete_skill_url)
        self.assertRedirects(response, reverse('accounts:edit'))

    def test_skill_delete_loads(self):
        super().login()
        response = self.client.get(self.delete_skill_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'accounts/skill_confirm_delete.html')

    def test_skill_delete_submits(self):
        super().login()
        response = self.client.post(self.delete_skill_url, {
            'name': 'lead_guitar'
        })

        self.assertRedirects(response, reverse('accounts:skills'))

        try:
            Skill.objects.get(pk=self.skill.pk)
        except ObjectDoesNotExist:
            self.assertRaises(ObjectDoesNotExist)
