import os
from googleapiclient.discovery import build
import isodate
from django.conf import settings

class YouTubeService:
    def __init__(self):
        self.api_key = getattr(settings, 'YOUTUBE_API_KEY', None)
        if not self.api_key:
            # Fallback to env if not in settings
            self.api_key = os.environ.get('YOUTUBE_API_KEY')
        
        if self.api_key:
            self.youtube = build('youtube', 'v3', developerKey=self.api_key)
        else:
            self.youtube = None

    def get_playlist_metadata(self, playlist_id):
        if not self.youtube:
            raise Exception("YouTube API Key not configured.")

        request = self.youtube.playlists().list(
            part="snippet",
            id=playlist_id
        )
        response = request.execute()

        if not response['items']:
            raise Exception("Playlist not found.")

        snippet = response['items'][0]['snippet']
        return {
            'title': snippet['title'],
            'thumbnail_url': snippet['thumbnails']['high']['url'],
        }

    def get_playlist_videos(self, playlist_id):
        if not self.youtube:
            raise Exception("YouTube API Key not configured.")

        videos = []
        next_page_token = None

        while True:
            request = self.youtube.playlistItems().list(
                part="snippet,contentDetails",
                playlistId=playlist_id,
                maxResults=50,
                pageToken=next_page_token
            )
            response = request.execute()

            for item in response['items']:
                videos.append({
                    'video_id': item['contentDetails']['videoId'],
                    'title': item['snippet']['title'],
                    'position': item['snippet']['position'],
                })

            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break

        # Fetch durations for all videos in batches of 50
        video_ids = [v['video_id'] for v in videos]
        durations = {}

        for i in range(0, len(video_ids), 50):
            batch_ids = video_ids[i:i+50]
            request = self.youtube.videos().list(
                part="contentDetails",
                id=",".join(batch_ids)
            )
            response = request.execute()

            for item in response.get('items', []):
                duration_str = item['contentDetails']['duration']
                duration_seconds = int(isodate.parse_duration(duration_str).total_seconds())
                durations[item['id']] = duration_seconds

        for v in videos:
            v['duration'] = durations.get(v['video_id'], 0)

        return videos
