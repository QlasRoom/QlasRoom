from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth.models import User
from .models import Category, Course, Video, VideoProgress, DailyCheckIn, Goal
from .serializers import (
    UserSerializer, CategorySerializer, CourseSerializer, 
    VideoSerializer, VideoProgressSerializer, DailyCheckInSerializer, GoalSerializer
)
from .services import YouTubeService
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.utils import timezone

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                # Generate verification link
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"
                
                subject = 'Activate your QlasRoom account'
                message = f"Hi {user.username},\n\nPlease click the link below to verify your account and start learning:\n\n{link}\n\nHappy learning!"
                
                email_sent = False
                try:
                    send_mail(
                        subject, 
                        message, 
                        settings.DEFAULT_FROM_EMAIL or 'noreply@qlasroom.com', 
                        [user.email],
                        fail_silently=False,
                    )
                    email_sent = True
                    msg = 'Verification email sent. Please check your inbox (including spam).'
                except Exception as e:
                    print(f"Email failure (manual registration): {e}")
                    # If email fails in DEBUG mode, still let them know what the link would have been
                    if settings.DEBUG:
                        msg = f'Account created. Email failed to send, but here is your link (DEBUG): {link}'
                    else:
                        msg = 'Account created, but we couldn\'t send a verification email. Please contact support.'
                
                return Response({
                    'message': msg,
                    'email_sent': email_sent,
                    'username': user.username
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer

    def get_queryset(self):
        return Course.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def import_playlist(self, request):
        playlist_id = request.data.get('playlist_id')
        category_id = request.data.get('category_id')
        custom_title = request.data.get('title')
        force = request.data.get('force', False)

        if not playlist_id:
            return Response({'error': 'playlist_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicates across all library for this user
        if not force:
            existing_course = Course.objects.filter(playlist_id=playlist_id, user=request.user).first()
            if existing_course:
                category_name = existing_course.category.name if existing_course.category else "Uncategorized"
                return Response({
                    'error': 'already_exists', 
                    'message': f'This course is already in your library (Category: {category_name}).'
                }, status=status.HTTP_409_CONFLICT)

        try:
            category = None
            if category_id:
                category = Category.objects.get(id=category_id, user=request.user)
            
            yt = YouTubeService()
            
            # Fetch metadata
            metadata = yt.get_playlist_metadata(playlist_id)
            
            # Create Course
            course = Course.objects.create(
                title=custom_title or metadata['title'],
                playlist_id=playlist_id,
                user=request.user,
                category=category,
                thumbnail_url=metadata['thumbnail_url']
            )

            # Fetch videos
            videos_data = yt.get_playlist_videos(playlist_id)
            for v_data in videos_data:
                Video.objects.create(
                    course=course,
                    video_id=v_data['video_id'],
                    title=v_data['title'],
                    position=v_data['position'],
                    duration=v_data['duration']
                )

            return Response(CourseSerializer(course, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        # Get unique course IDs from recently updated VideoProgress, excluding archived courses
        recent_progress = VideoProgress.objects.filter(
            user=request.user, 
            video__course__is_archived=False
        ).order_by('-updated_at')
        
        course_ids = []
        seen_course_ids = set()
        
        for p in recent_progress:
            c_id = p.video.course_id
            if c_id not in seen_course_ids:
                course_ids.append(c_id)
                seen_course_ids.add(c_id)
            if len(course_ids) >= 5:
                break

        
        if not course_ids:
            return Response([])
            
        # Preserving the order of course_ids
        sorting = {id: index for index, id in enumerate(course_ids)}
        courses = sorted(Course.objects.filter(id__in=course_ids), key=lambda c: sorting[c.id])
        
        return Response(CourseSerializer(courses, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def move(self, request, pk=None):
        course = self.get_object()
        category_id = request.data.get('category_id') # Can be None or "none" to uncategorize
        
        try:
            target_category = None
            if category_id and category_id != "none":
                target_category = Category.objects.get(id=category_id, user=request.user)
            
            course.category = target_category
            course.save()
            return Response(CourseSerializer(course, context={'request': request}).data)
        except (Category.DoesNotExist, ValueError):
            return Response({'error': 'Target category not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        course = self.get_object()
        course.is_archived = True
        course.save()
        return Response(CourseSerializer(course, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        course = self.get_object()
        course.is_archived = False
        course.save()
        return Response(CourseSerializer(course, context={'request': request}).data)

class VideoProgressViewSet(viewsets.ModelViewSet):
    serializer_class = VideoProgressSerializer

    def get_queryset(self):
        return VideoProgress.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def heartbeat(self, request):
        video_id = request.data.get('video_id')
        last_position = request.data.get('last_position', 0)

        if not video_id:
            return Response({'error': 'video_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            video = Video.objects.get(id=video_id)
            progress, created = VideoProgress.objects.get_or_create(
                user=request.user,
                video=video
            )
            
            progress.last_position = last_position
            
            # Completion logic (90% threshold)
            if video.duration > 0 and (last_position / video.duration) >= 0.9:
                progress.is_completed = True
            
            progress.save()
            return Response(VideoProgressSerializer(progress).data)
        except Video.DoesNotExist:
            return Response({'error': 'Video not found'}, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('credential')
        if not token:
            return Response({'error': 'Credential missing'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the Google Token
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )

            # Get user info
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            # Use email prefix as username if user doesn't exist
            username = email.split('@')[0]
            
            # Find or create user
            user, created = User.objects.get_or_create(email=email, defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
            })

            # If Google identifies them, they are verified
            if not user.is_active:
                user.is_active = True
                user.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)

            # Mark attendance automatically
            DailyCheckIn.objects.get_or_create(user=user, date=timezone.now().date())

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })

        except Exception as e:
            error_details = str(e)
            
            # Specific handling for database connectivity / unrun migrations
            if "relation" in error_details.lower() or "table" in error_details.lower():
                msg = "Database Error: It looks like migrations haven't been run on production yet."
            elif "audience" in error_details.lower():
                msg = "Google Client ID mismatch. Please check your .env settings."
            elif "expired" in error_details.lower():
                msg = "Google token has expired. Please sign in again."
            else:
                msg = f"Google verification failed: {error_details}"
                
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'message': 'Email verified successfully!'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid or expired verification link.'}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    def get(self, request):
        # Mark attendance automatically when profile is fetched (e.g. on app load/login)
        DailyCheckIn.objects.get_or_create(user=request.user, date=timezone.now().date())
        
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DailyCheckInViewSet(viewsets.ModelViewSet):
    serializer_class = DailyCheckInSerializer

    def get_queryset(self):
        return DailyCheckIn.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer

    def get_queryset(self):
        # Allow filtering by date if provided
        queryset = Goal.objects.filter(user=self.request.user)
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
