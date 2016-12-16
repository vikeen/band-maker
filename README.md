# Melody Buddy

### Depencies

* [Python](http://install.python-guide.org)
* [Postgres](https://devcenter.heroku.com/articles/heroku-postgresql#local-setup)
* Node

```sh
$ npm install
$ npm install -g gulp
$ sudo apt install python3-pip
$ python3 -m venv venv
$ source ./venv/bin/activate
$ sudo apt-get install libpq-dev
$ pip install -r requirements.txt
```

### Database

```sql
CREATE DATABASE melody_buddy;
CREATE ROLE melody_buddy_user with PASSWORD 'password';
ALTER ROLE melody_buddy_user with LOGIN;
ALTER ROLE melody_buddy_user WITH CREATEDB;
ALTER DATABASE melody_buddy OWNER TO melody_buddy_user;
```

```sh
$ python manage.py migrate
$ python manage.py collectstatic
```

### Development

* `python manage.py runserver` - Server
* `gulp` - Frontend Assets

Your app should now be running on [localhost:8000](http://localhost:8000/).

## Deploying to Heroku

```sh
$ git push heroku master
$ heroku run python manage.py collectstatic
$ heroku run python manage.py migrate
$ heroku open
```
or

## Documentation

For more information about using Python on Heroku, see these Dev Center articles:

- [Python on Heroku](https://devcenter.heroku.com/categories/python)
