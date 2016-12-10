git push heroku master &&
heroku run python manage.py collectstatic &&
heroku run python manage.py migrate;
