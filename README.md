# Band Maker

A barebones Python app, which can easily be deployed to Heroku.

This application supports the [Getting Started with Python on Heroku](https://devcenter.heroku.com/articles/getting-started-with-python) article - check it out.

## Running Locally

Make sure you have Python [installed properly](http://install.python-guide.org).  Also, install the [Heroku Toolbelt](https://toolbelt.heroku.com/) and [Postgres](https://devcenter.heroku.com/articles/heroku-postgresql#local-setup).

### Depencies

```sh
$ pip install -r requirements.txt
```

### Database

```sql
CREATE DATABASE band_maker;
CREATE ROLE band_maker_user with PASSWORD 'password';
ALTER DATABASE band_maker OWNER TO band_maker_user;
ALTER ROLE band_maker_user with LOGIN;
```

```sh
$ python manage.py migrate
$ python manage.py collectstatic

$ python manage.py runserver
```

Your app should now be running on [localhost:8000](http://localhost:8000/).

## Deploying to Heroku

```sh
$ git push heroku master
$ heroku run python manage.py migrate
$ heroku open
```
or

## Documentation

For more information about using Python on Heroku, see these Dev Center articles:

- [Python on Heroku](https://devcenter.heroku.com/categories/python)
