'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/services/api';
import { ArrowLeft, CheckCircle2, ChevronRight, Play, Clock } from 'lucide-react';

const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

export default function CoursePlayer() {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [currentVideo, setCurrentVideo] = useState(null);
    const currentVideoRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [apiReady, setApiReady] = useState(false);
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const playerRef = useRef(null);
    const heartbeatInterval = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/?auth=login');
            return;
        }

        fetchCourse();
        loadYouTubeAPI();
        return () => stopHeartbeat();
    }, [id]);

    useEffect(() => {
        currentVideoRef.current = currentVideo;
    }, [currentVideo]);

    const loadYouTubeAPI = () => {
        if (window.YT && window.YT.Player) {
            setApiReady(true);
            return;
        }

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        window.onYouTubeIframeAPIReady = () => {
            setApiReady(true);
        };
    };

    const fetchCourse = async () => {
        try {
            const response = await api.get(`/courses/${id}/`);
            setCourse(response.data);
            if (response.data.videos?.length > 0) {
                // Find first incomplete video or default to last played
                const firstIncomplete = response.data.videos.find(v => !v.is_completed) || response.data.videos[0];
                setCurrentVideo(firstIncomplete);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                router.push('/?auth=login');
            } else {
                setError('Failed to load course details.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentVideo && apiReady) {
            initPlayer(currentVideo);
        }
    }, [currentVideo, apiReady]);

    const initPlayer = (video) => {
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
            console.log(`Loading video ${video.title} at ${video.last_position}`);
            playerRef.current.loadVideoById({
                videoId: video.video_id,
                startSeconds: video.last_position || 0
            });
            // Backup seek after a short delay to ensure it catches
            setTimeout(() => {
                if (playerRef.current && playerRef.current.seekTo) {
                    playerRef.current.seekTo(video.last_position || 0);
                }
            }, 1000);
            return;
        }

        if (playerRef.current) return;

        playerRef.current = new window.YT.Player('youtube-player', {
            videoId: video.video_id,
            playerVars: {
                autoplay: 1,
                modestbranding: 1,
                rel: 0,
                start: video.last_position || 0
            },
            events: {
                'onStateChange': onPlayerStateChange,
                'onReady': (event) => {
                    console.log(`Player ready for ${video.title}, seeking to ${video.last_position}`);
                    if (video.last_position) {
                        event.target.seekTo(video.last_position, true);
                        event.target.playVideo();
                    }
                }
            }
        });
    };

    const onPlayerReady = (event) => {
        // Player is ready
    };

    const onPlayerStateChange = (event) => {
        if (event.data === window.YT.PlayerState.PLAYING) {
            startHeartbeat();
        } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
            stopHeartbeat();
        }
    };

    const startHeartbeat = () => {
        if (heartbeatInterval.current) return;
        
        heartbeatInterval.current = setInterval(async () => {
            if (playerRef.current && playerRef.current.getCurrentTime && currentVideoRef.current) {
                const currentTime = Math.floor(playerRef.current.getCurrentTime());
                try {
                    await api.post('/progress/heartbeat/', {
                        video_id: currentVideoRef.current.id,
                        last_position: currentTime
                    });
                } catch (err) {
                    console.error('Heartbeat failed', err);
                }
            }
        }, 10000); // 10 seconds
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
    };

    const handleVideoSelect = (video) => {
        setCurrentVideo(video);
    };

    const handleMarkCompleted = async () => {
        try {
            await api.post('/progress/heartbeat/', {
                video_id: currentVideo.id,
                last_position: currentVideo.duration
            });
            // Refresh course data to update syllabus
            fetchCourse();
        } catch (err) {
            console.error('Failed to mark as completed', err);
        }
    };

    if (loading) return <div className="auth-container"><p>Entering the classroom...</p></div>;
    if (error) return <div className="auth-container"><p style={{ color: 'var(--danger-color)' }}>{error}</p></div>;

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column-reverse' : 'row', 
            height: isMobile ? 'auto' : '100vh', 
            overflow: isMobile ? 'visible' : 'hidden', 
            background: '#000' 
        }}>
            {/* Sidebar - Course Syllabus */}
            <div style={{ 
                width: isMobile ? '100%' : '350px', 
                background: 'var(--surface-color)', 
                borderRight: isMobile ? 'none' : '1px solid var(--border-color)', 
                borderTop: isMobile ? '1px solid var(--border-color)' : 'none',
                display: 'flex', 
                flexDirection: 'column',
                zIndex: 10,
                height: 'auto',
                minHeight: isMobile ? '400px' : 'none'
            }}>
                <div style={{ padding: isMobile ? '1.5rem 1.2rem' : '2rem', borderBottom: '1px solid var(--border-color)' }}>
                    <button 
                        onClick={() => router.push('/dashboard')} 
                        style={{ color: 'var(--text-dim)', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={16} /> Back to Library
                    </button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{course.title}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        <Clock size={12} /> {formatDuration(course.total_duration)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div style={{ flex: 1, height: '4px', background: '#333', borderRadius: '2px' }}>
                            <div style={{ width: `${course.progress_percentage}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '2px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{course.progress_percentage}%</span>
                    </div>
                </div>
                
                <div style={{ flex: isMobile ? 'none' : 1, overflowY: isMobile ? 'visible' : 'auto', padding: '1rem 0' }}>
                    {course.videos?.map((video) => (
                        <div 
                            key={video.id} 
                            onClick={() => handleVideoSelect(video)}
                            style={{ 
                                padding: isMobile ? '0.8rem 1.2rem' : '1rem 2rem', 
                                cursor: 'pointer',
                                background: currentVideo?.id === video.id ? 'rgba(174, 129, 255, 0.1)' : 'transparent',
                                borderLeft: `3px solid ${currentVideo?.id === video.id ? 'var(--primary-color)' : video.is_completed ? 'var(--secondary-color)' : 'transparent'}`,
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            className="syllabus-item"
                        >
                            <span style={{ 
                                minWidth: '24px', 
                                height: '24px', 
                                border: `1px solid ${video.is_completed ? 'var(--secondary-color)' : 'var(--border-color)'}`, 
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: video.is_completed ? 'var(--secondary-color)' : 'var(--text-dim)',
                                fontSize: '0.7rem',
                                flexShrink: 0
                            }}>
                                {video.is_completed ? <CheckCircle2 size={12} /> : video.position + 1}
                            </span>
                            <p style={{ 
                                fontSize: '0.9rem', 
                                color: currentVideo?.id === video.id ? '#fff' : 'var(--text-dim)',
                                fontWeight: currentVideo?.id === video.id ? 600 : 400,
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                margin: 0
                            }}>
                                {currentVideo?.id === video.id && <Play size={12} fill="currentColor" style={{ flexShrink: 0 }} />}
                                {video.title}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content - Video Player */}
            <div style={{ 
                flex: isMobile ? 'none' : 1, 
                position: isMobile ? 'sticky' : 'relative', 
                top: isMobile ? 0 : 'auto',
                display: 'flex', 
                flexDirection: 'column',
                width: '100%',
                zIndex: 20
            }}>
                <div style={{ 
                    width: '100%', 
                    background: '#000', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: isMobile ? 'calc(100vw * 9 / 16)' : 'auto',
                    flex: isMobile ? 'none' : 1
                }}>
                    <div id="youtube-player" style={{ width: '100%', height: '100%' }}></div>
                    {!currentVideo && <p style={{ color: 'var(--text-dim)' }}>Select a video to start learning.</p>}
                </div>
                
                {/* Video Info Overlay (Bottom) */}
                {currentVideo && (
                    <div style={{ 
                        padding: isMobile ? '1rem 1.2rem' : '1.5rem 3rem', 
                        background: 'rgba(18, 18, 18, 0.9)', 
                        backdropFilter: 'blur(10px)',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '1rem' : '0px',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'stretch' : 'center'
                    }}>
                        <div>
                            <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', margin: 0 }}>{currentVideo.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.2rem', marginBottom: 0 }}>
                                {currentVideo.is_completed ? 'Completed' : 'In Progress'}
                            </p>
                        </div>
                        <button 
                            onClick={handleMarkCompleted}
                            className="btn-primary" 
                            style={{ 
                                width: isMobile ? '100%' : 'auto', 
                                padding: '0.6rem 1.5rem', 
                                fontSize: '0.9rem',
                                background: currentVideo.is_completed ? 'transparent' : 'var(--primary-gradient)',
                                color: currentVideo.is_completed ? 'var(--secondary-color)' : '#000',
                                border: currentVideo.is_completed ? '1px solid var(--secondary-color)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                margin: 0
                            }}
                            disabled={currentVideo.is_completed}
                        >
                            {currentVideo.is_completed ? (
                                <>Course Completed <CheckCircle2 size={18} /></>
                            ) : (
                                <>Mark as Completed <CheckCircle2 size={18} /></>
                            )}
                        </button>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .syllabus-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
            `}</style>
        </div>
    );
}
