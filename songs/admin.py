from django.contrib import admin

from .models import Song, Track, TrackRequest


class SongAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'updated', 'created')
    exclude = ('license',)
    readonly_fields = ('uuid',)
    search_fields = ('title',)
    list_filter = ('updated', 'created')


class TrackAdmin(admin.ModelAdmin):
    list_display = ('instrument', 'song', 'created_by', 'contributed_by', 'updated', 'created')
    exclude = ('license', 'song')
    readonly_fields = ('uuid',)
    search_fields = ('song__title',)
    list_filter = ('updated', 'created')


class TrackRequestAdmin(admin.ModelAdmin):
    list_display = ('track', 'created_by', 'status', 'updated', 'created')
    exclude = ('license', 'track')
    list_filter = ('status', 'updated', 'created')


admin.site.register(Song, SongAdmin)
admin.site.register(Track, TrackAdmin)
admin.site.register(TrackRequest, TrackRequestAdmin)
