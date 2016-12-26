from django import template

register = template.Library()


@register.inclusion_tag('users/avatar_image.html')
def avatar_image(user, *args, **kwargs):
    return {
        'user': user,
        'size': kwargs.get('size', 50),
        'class': kwargs.get('class', '')
    }
