from django.core.management.base import BaseCommand

from apps.subjects.models import Subject


SUBJECTS = [
    ("math", "Higher Mathematics"),
    ("physics", "Physics"),
    ("programming", "Programming"),
    ("algorithms", "Algorithms"),
    ("databases", "Databases"),
    ("networks", "Computer Networks"),
]


class Command(BaseCommand):
    help = "Create or update the fixed subject list for the demo."

    def handle(self, *args, **kwargs):
        for index, (slug, name) in enumerate(SUBJECTS, start=1):
            Subject.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "sort_order": index},
            )

