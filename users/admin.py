from django.contrib import admin

from .models import Skill


class SkillAdmin(admin.ModelAdmin):
    fields = ('name',)
    list_display = ('user', 'name')
    list_filter = ('updated', 'created', 'name')


admin.site.register(Skill, SkillAdmin)
