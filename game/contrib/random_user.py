from random import choice
from string import ascii_lowercase, digits
from game.users.models import User


def random_user(game_type, linked_id='', length=80, chars=ascii_lowercase+digits):
    username = ''.join([choice(chars) for i in range(length)])
    try:
        User.objects.get(username=username)
        return random_user(game_type, linked_id=linked_id, length=length, chars=chars)
    except User.DoesNotExist:
        u = User(username=username, linked_id=linked_id, game_type=game_type)
        u.save()
        password = User.objects.make_random_password()
        u.set_password(password)
        u.save()
        return u, password
