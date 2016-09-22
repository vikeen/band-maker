from django.conf.urls import url

import signup.views

urlpatterns = [
    url(r'^$', signup.views.create)
]
