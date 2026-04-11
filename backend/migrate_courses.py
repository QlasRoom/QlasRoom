from classroom.models import Course
courses = Course.objects.all()
for course in courses:
    if course.category:
        course.user = course.category.user
        course.save()
        print(f'Preserved ownership for: {course.title}')
    else:
        print(f'Skipped orphan course: {course.title}')
