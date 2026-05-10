from django.core.management.base import BaseCommand

from apps.subjects.models import Subject


SUBJECTS = [
    ("math", "Вища математика"),
    ("physics", "Фізика"),
    ("programming", "Програмування"),
    ("algorithms", "Алгоритми"),
    ("databases", "Бази даних"),
    ("networks", "Комп'ютерні мережі"),
]


class Command(BaseCommand):
    help = "Create or update the fixed subject list for the demo."

    def handle(self, *args, **kwargs):
        for index, (slug, name) in enumerate(SUBJECTS, start=1):
            Subject.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "sort_order": index},
            )
