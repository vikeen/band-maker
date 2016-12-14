from django import template
from django.template.defaultfilters import stringfilter

from ..models import Track

register = template.Library()


@register.filter(name='instrument_name')
@stringfilter
def get_instrument_name(value):
    instrument_categories = [x[1] for x in Track.TRACK_INSTRUMENT_CHOICES]

    for instrument_category in instrument_categories:
        for instrument in instrument_category:
            if instrument[0] == value:
                return instrument[1]

    return value
