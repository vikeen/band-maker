from django import template

register = template.Library()


@register.simple_tag(name='song_wizard_navigation_class', takes_context=True)
def song_wizard_navigation_class(context, *args, **kwargs):
    view_name = context['request'].resolver_match.view_name

    if view_name in kwargs.get("steps"):
        return "wizard__step wizard__step--active"
    else:
        return "wizard__step"
