from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Course, Video, VideoProgress, DailyCheckIn, Goal

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'read_only': True},
            'username': {'read_only': True}
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.is_active = False # Deactivate until email verified
        user.save()
        return user


class VideoSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    last_position = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = ('id', 'video_id', 'title', 'position', 'duration', 'is_completed', 'last_position')

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        progress = VideoProgress.objects.filter(user=request.user, video=obj).first()
        return progress.is_completed if progress else False

    def get_last_position(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        progress = VideoProgress.objects.filter(user=request.user, video=obj).first()
        return progress.last_position if progress else 0

class CourseSerializer(serializers.ModelSerializer):
    videos = VideoSerializer(many=True, read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    total_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ('id', 'title', 'playlist_id', 'user', 'category', 'thumbnail_url', 'videos', 'progress_percentage', 'total_duration', 'is_archived')
        read_only_fields = ('user',)

    def get_total_duration(self, obj):
        return sum(video.duration for video in obj.videos.all())

    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        if not user or user.is_anonymous:
            return 0
        
        total_videos = obj.videos.count()
        if total_videos == 0:
            return 0
            
        completed_videos = VideoProgress.objects.filter(
            user=user, 
            video__course=obj, 
            is_completed=True
        ).count()
        
        return int((completed_videos / total_videos) * 100)

class CategorySerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'courses', 'created_at')
        read_only_fields = ('user',)

    def validate(self, data):
        request = self.context.get('request')
        name = data.get('name')
        
        if request and request.user:
            # Check for existing category with same name for this user (case-insensitive)
            query = Category.objects.filter(user=request.user, name__iexact=name)
            
            # If updating, exclude the current category
            if self.instance:
                query = query.exclude(id=self.instance.id)
                
            if query.exists():
                raise serializers.ValidationError({"name": "A category with this name already exists."})
                
        return data


class VideoProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProgress
        fields = '__all__'
        read_only_fields = ('user',)

class DailyCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyCheckIn
        fields = ('id', 'date')
        read_only_fields = ('id',)

    def create(self, validated_data):
        user = self.context['request'].user
        # Prevent double check-ins via serializer too (though unique_together handles it)
        checkin, created = DailyCheckIn.objects.get_or_create(
            user=user, 
            date=validated_data['date']
        )
        return checkin

class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ('id', 'text', 'completed', 'date', 'created_at')
        read_only_fields = ('id', 'created_at')
