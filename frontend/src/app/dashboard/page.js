'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/services/api';
import Sidebar from './Sidebar';
import { 
    Plus, 
    LogOut, 
    Settings, 
    BarChart3, 
    Folder, 
    BookOpen, 
    GraduationCap, 
    Archive,
    Trash2,
    RotateCcw,
    X,
    Search,
    Clock,
    Sliders,
    ChevronDown,
    CheckCircle2,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const formatDuration = (seconds) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

function Dashboard() {
    const [categories, setCategories] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [recentCourses, setRecentCourses] = useState([]);
    const [user, setUser] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [categoryError, setCategoryError] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const router = useRouter();

    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isManageCoursesModalOpen, setIsManageCoursesModalOpen] = useState(false);
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [courseSearchQuery, setCourseSearchQuery] = useState('');
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'learning';
    const [selectedCategoryIdFilter, setSelectedCategoryIdFilter] = useState('all');
    const [isMoreCategoriesOpen, setIsMoreCategoriesOpen] = useState(false);
    const [selectedManageCategoryId, setSelectedManageCategoryId] = useState('all'); // 'all', 'none', or numeric ID
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    
    // Analytics & Tools State
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');
    const [checkIns, setCheckIns] = useState([]); // List of YYYY-MM-DD strings
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/?auth=login');
            return;
        }

        // Event listeners for global Navbar actions
        const handleOpenImport = () => {
            setSelectedCategoryId(categories.length > 0 ? categories[0].id : '');
            setIsCourseModalOpen(true);
        };
        const handleOpenManageCategories = () => router.push('/dashboard?tab=manage');
        const handleOpenManageCourses = () => router.push('/dashboard?tab=manage');

        window.addEventListener('open-import-modal', handleOpenImport);
        window.addEventListener('open-manage-categories', handleOpenManageCategories);
        window.addEventListener('open-manage-courses', handleOpenManageCourses);

        fetchCategories();
        fetchUser();
        fetchRecentCourses();
        fetchAnalytics();

        return () => {
            window.removeEventListener('open-import-modal', handleOpenImport);
            window.removeEventListener('open-manage-categories', handleOpenManageCategories);
            window.removeEventListener('open-manage-courses', handleOpenManageCourses);
        };
    }, [categories.length]);

    const fetchAnalytics = async () => {
        try {
            const responses = await Promise.allSettled([
                api.get('/daily-checkins/'),
                api.get('/goals/')
            ]);
            
            const checkRes = responses[0].status === 'fulfilled' ? responses[0].value : null;
            const goalsRes = responses[1].status === 'fulfilled' ? responses[1].value : null;

            if (!checkRes || !goalsRes) {
                console.warn('One or more analytics endpoints failed to load.');
            }
            
            const serverCheckIns = checkRes ? checkRes.data.map(c => c.date) : [];
            const serverGoals = goalsRes ? goalsRes.data : [];

            const serverCheckIns = checkRes ? checkRes.data.map(c => c.date) : [];
            const serverGoals = goalsRes ? goalsRes.data : [];

            setCheckIns(serverCheckIns);
            setTodos(serverGoals);

            // Auto-checkin is now handled on the backend via the /me/ profile fetch
        } catch (err) {
            console.error('Critical failure in fetchAnalytics', err);
        }
    };

    const fetchRecentCourses = async () => {
        try {
            const response = await api.get('/courses/recent/');
            setRecentCourses(response.data);
        } catch (err) {
            console.error('Failed to fetch recent courses');
        }
    };

    const fetchUser = async () => {
        try {
            const response = await api.get('/me/');
            setUser(response.data);
        } catch (err) {
            console.error('Failed to fetch user');
        }
    };

    const fetchCategories = async () => {
        try {
            const [catsRes, coursesRes] = await Promise.all([
                api.get('/categories/'),
                api.get('/courses/')
            ]);
            setCategories(catsRes.data);
            setAllCourses(coursesRes.data);
        } catch (err) {
            setError('Failed to fetch library data');
        } finally {
            setLoading(false);
        }
    };

    // Todo & Check-in Logic
    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        try {
            const response = await api.post('/goals/', {
                text: newTodo,
                completed: false,
                date: selectedDate
            });
            setTodos([response.data, ...todos]);
            setNewTodo('');
        } catch (err) {
            console.error('Failed to add goal');
        }
    };

    const toggleTodo = async (id) => {
        const todo = todos.find(t => t.id === id);
        if (!todo) return;
        try {
            const response = await api.patch(`/goals/${id}/`, {
                completed: !todo.completed
            });
            setTodos(todos.map(t => t.id === id ? response.data : t));
        } catch (err) {
            console.error('Failed to toggle goal');
        }
    };

    const deleteTodo = async (id) => {
        try {
            await api.delete(`/goals/${id}/`);
            setTodos(todos.filter(t => t.id !== id));
        } catch (err) {
            console.error('Failed to delete goal');
        }
    };

    const handleCheckIn = (dateStr) => {
        // Manual check-in is disabled in UI but keeping logic just in case
        // or for future enable
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) return;

        // Local check for immediate feedback
        const exists = categories.some(cat => cat.name.toLowerCase() === trimmedName.toLowerCase());
        if (exists) {
            setCategoryError('A category with this name already exists.');
            return;
        }

        try {
            await api.post('/categories/', { name: trimmedName });
            setNewCategoryName('');
            setCategoryError('');
            setIsAddCategoryModalOpen(false);
            fetchCategories();
        } catch (err) {
            const rawError = err.response?.data?.name;
            const errorMsg = Array.isArray(rawError) ? rawError[0] : (rawError || 'Failed to add category');
            setCategoryError(errorMsg);
        }
    };



    const handleDeleteCategory = async (id) => {
        if (!confirm('Are you sure you want to delete this category? All courses inside will be lost.')) return;
        try {
            await api.delete(`/categories/${id}/`);
            setCategories(categories.filter(cat => cat.id !== id));
        } catch (err) {
            setError('Failed to delete category');
        }
    };

    const handleImportCourse = async (e, force = false) => {
        if (e) e.preventDefault();
        if (!playlistUrl.trim() || !selectedCategoryId) return;
        
        setIsImporting(true);
        setError('');
        try {
            // Extract playlist ID from URL if necessary
            let playlistId = playlistUrl;
            if (playlistUrl.includes('list=')) {
                playlistId = new URL(playlistUrl).searchParams.get('list');
            }

            await api.post('/courses/import_playlist/', {
                playlist_id: playlistId,
                category_id: selectedCategoryId,
                title: courseTitle,
                force: force
            });
            
            setIsCourseModalOpen(false);
            setPlaylistUrl('');
            setCourseTitle('');
            fetchCategories(); // Refresh to show new course
            fetchRecentCourses();
        } catch (err) {
            if (err.response?.status === 409) {
                const confirmAdd = window.confirm(
                    `${err.response.data.message}\n\nDo you want to add it again to this category anyway?`
                );
                if (confirmAdd) {
                    handleImportCourse(null, true);
                    return; // Don't proceed to finally block yet as the recursive call handles it
                }
            } else {
                setError(err.response?.data?.error || 'Failed to import playlist. Check your API key or Playlist ID.');
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        router.push('/');
    };

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course? All your progress will be lost.')) return;
        try {
            await api.delete(`/courses/${courseId}/`);
            fetchCategories(); // Refresh everything
            fetchRecentCourses();
        } catch (err) {
            setError('Failed to delete course');
        }
    };

    const handleBulkDeleteCourses = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedCourseIds.length} courses?`)) return;
        try {
            await Promise.all(selectedCourseIds.map(id => api.delete(`/courses/${id}/`)));
            setSelectedCourseIds([]);
            fetchCategories();
            fetchRecentCourses();
        } catch (err) {
            setError('Failed to delete some courses');
        }
    };

    const handleBulkMoveCourses = async (targetCategoryId) => {
        try {
            await Promise.all(selectedCourseIds.map(id => 
                api.post(`/courses/${id}/move/`, { category_id: targetCategoryId })
            ));
            setSelectedCourseIds([]);
            fetchCategories();
        } catch (err) {
            setError('Failed to move some courses');
        }
    };

    const handleToggleArchiveCourse = async (courseId, currentStatus) => {
        const action = currentStatus ? 'restore' : 'archive';
        if (!confirm(`Are you sure you want to ${action} this course?`)) return;
        
        try {
            if (currentStatus) {
                await api.post(`/courses/${courseId}/unarchive/`);
            } else {
                await api.post(`/courses/${courseId}/archive/`);
            }
            fetchCategories();
            fetchRecentCourses();
        } catch (err) {
            setError(`Failed to ${action} course`);
        }
    };

    const handleBulkArchiveCourses = async (toArchive) => {
        try {
            await Promise.all(selectedCourseIds.map(id => 
                api.post(`/courses/${id}/${toArchive ? 'archive' : 'unarchive'}/`)
            ));
            setSelectedCourseIds([]);
            fetchCategories();
            fetchRecentCourses();
        } catch (err) {
            setError('Failed to update status for some courses');
        }
    };

    if (loading) return <div className="auth-container"><p>Loading your classroom...</p></div>;

    return (
        <div className="container" style={{ 
            paddingTop: '1.5rem',
            paddingBottom: activeTab === 'manage' ? '1.5rem' : '4rem',
            paddingLeft: '3rem',
            paddingRight: '3rem',
            display: 'flex',
            flexDirection: 'column',
            flex: 1
        }}>


            {/* Tab Switcher - Removed as it moved to header */}

            {error && <p style={{ color: 'var(--danger-color)', marginBottom: '1rem', background: 'rgba(249, 38, 114, 0.1)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--danger-color)' }}>{error}</p>}

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: activeTab !== 'manage' ? '1fr 260px' : '1fr', 
                gap: '2.5rem',
                alignItems: 'start'
            }}>
                {/* Main Content Area */}
                <div style={{ minWidth: 0 }}>
                    {/* Conditional Course Creation Form (Empty State) - Inside Grid */}
                    {allCourses.length === 0 && !loading && activeTab === 'learning' && (
                        <div style={{ marginBottom: '3rem', textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'var(--primary-gradient)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }}></div>
                            
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem' }}>Create your first <span className="gradient-text">Course</span></h2>
                                <p style={{ color: 'var(--text-dim)', marginBottom: '2.5rem', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
                                    Paste a YouTube Playlist URL below to transform it into a distraction-free educational dashboard.
                                </p>
                                
                                <form 
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (!playlistUrl.trim()) return;
                                        setIsImporting(true);
                                        try {
                                            let playlistId = playlistUrl;
                                            if (playlistUrl.includes('list=')) {
                                                playlistId = new URL(playlistUrl).searchParams.get('list');
                                            }
                                            
                                            await api.post('/courses/import_playlist/', {
                                                playlist_id: playlistId,
                                                category_id: null,
                                                title: courseTitle
                                            });
                                            
                                            setPlaylistUrl('');
                                            setCourseTitle('');
                                            fetchCategories();
                                            fetchRecentCourses();
                                        } catch (err) {
                                            setError('Failed to setup your first course. Please check the URL.');
                                        } finally {
                                            setIsImporting(false);
                                        }
                                    }} 
                                    style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', maxWidth: '550px', margin: '0 auto' }}
                                >
                                    <input 
                                        type="text" 
                                        className="form-group" 
                                        style={{ margin: 0, padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', flex: 1, fontSize: '0.95rem' }}
                                        placeholder="Paste YouTube Playlist URL..."
                                        value={playlistUrl}
                                        onChange={(e) => setPlaylistUrl(e.target.value)}
                                        required
                                    />
                                    <input 
                                        type="text" 
                                        className="form-group" 
                                        style={{ margin: 0, padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', color: '#fff', flex: 1, fontSize: '0.95rem' }}
                                        placeholder="Course Name (Optional)"
                                        value={courseTitle}
                                        onChange={(e) => setCourseTitle(e.target.value)}
                                    />
                                    <button type="submit" className="btn-primary" disabled={isImporting} style={{ margin: '0.5rem 0 0', width: '100%', padding: '1rem', borderRadius: '12px', fontSize: '1rem' }}>
                                        {isImporting ? 'Setting up...' : 'Create Course'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}


            {/* Continue Learning - Hide when in Archived tab */}
            {activeTab === 'learning' && recentCourses.length > 0 && (
                <section style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <BookOpen size={24} style={{ color: 'var(--primary-color)' }} /> Continue Learning
                    </h2>
                    <div style={{ 
                        display: 'grid', 
                        gridAutoFlow: 'column',
                        gridAutoColumns: '450px',
                        justifyContent: 'start',
                        gap: '2rem',
                        overflowX: 'auto',
                        paddingBottom: '1rem'
                    }}>




                        {recentCourses.map((course) => (
                            <div 
                                key={course.id} 
                                className="category-card" 
                                style={{ 
                                    padding: '1.5rem', 
                                    display: 'flex', 
                                    gap: '1.5rem', 
                                    alignItems: 'center',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => router.push(`/course/${course.id}`)}
                            >
                                <img 
                                    src={course.thumbnail_url} 
                                    alt={course.title} 
                                    style={{ 
                                        width: '180px', 
                                        height: '100px', 
                                        borderRadius: '12px', 
                                        objectFit: 'cover',
                                        flexShrink: 0
                                    }} 
                                />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h4 style={{ 
                                                fontSize: '1.1rem', 
                                                margin: 0, 
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: '1.4',
                                                fontWeight: 600
                                            }}>
                                                {course.title}
                                            </h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '20px', flexShrink: 0 }}>
                                                <Clock size={12} /> {formatDuration(course.total_duration)}
                                            </div>
                                        </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{ flex: 1, height: '6px', background: '#222', borderRadius: '3px' }}>
                                            <div style={{ width: `${course.progress_percentage}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '3px' }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', minWidth: '40px' }}>
                                            {course.progress_percentage}%
                                        </span>
                                    </div>
                                    <button 
                                        className="btn-primary" 
                                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.8rem', width: 'auto' }}
                                    >
                                        Resume Course
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* All Courses Gallery - Show if courses exist, or if on archived tab to show empty state */}
            {activeTab !== 'manage' && (allCourses.length > 0 || activeTab === 'archived') && (
                <section style={{ marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0 0 1rem 0' }}>
                        {activeTab === 'learning' ? 
                            <GraduationCap size={24} style={{ color: 'var(--primary-color)' }} /> : 
                            <Archive size={24} style={{ color: 'var(--primary-color)' }} />
                        } 
                        {activeTab === 'learning' ? 'Active Courses' : 'Archived Courses'} 
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                            ({
                                allCourses.filter(c => 
                                    (activeTab === 'learning' ? !c.is_archived : c.is_archived) && 
                                    (selectedCategoryIdFilter === 'all' ? true : (selectedCategoryIdFilter === null ? c.category === null : c.category === parseInt(selectedCategoryIdFilter)))
                                ).length
                            })
                        </span>
                    </h2>

                    {/* Category Filter Bar (Re-positioned between heading and courses) */}
                    {allCourses.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'center' }}>
                            <button 
                                onClick={() => setSelectedCategoryIdFilter('all')}
                                style={{ 
                                    padding: '0.5rem 1.2rem', 
                                    borderRadius: '20px', 
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    background: selectedCategoryIdFilter === 'all' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                    color: selectedCategoryIdFilter === 'all' ? '#000' : '#fff',
                                    border: '1px solid',
                                    borderColor: selectedCategoryIdFilter === 'all' ? 'transparent' : 'rgba(255,255,255,0.1)',
                                    transition: 'all 0.3s ease',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                All
                            </button>

                            {allCourses.some(c => c.category === null) && (
                                <button 
                                    onClick={() => setSelectedCategoryIdFilter(null)}
                                    style={{ 
                                        padding: '0.5rem 1.2rem', 
                                        borderRadius: '20px', 
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        background: selectedCategoryIdFilter === null ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                        color: selectedCategoryIdFilter === null ? '#000' : '#fff',
                                        border: '1px solid',
                                        borderColor: selectedCategoryIdFilter === null ? 'transparent' : 'rgba(255,255,255,0.1)',
                                        transition: 'all 0.3s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Uncategorized
                                </button>
                            )}
                            
                            {categories.slice(0, 7).map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategoryIdFilter(cat.id.toString());
                                        setIsMoreCategoriesOpen(false);
                                    }}
                                    style={{ 
                                        padding: '0.5rem 1.2rem', 
                                        borderRadius: '20px', 
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        background: selectedCategoryIdFilter === cat.id.toString() ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                        color: selectedCategoryIdFilter === cat.id.toString() ? '#000' : '#fff',
                                        border: '1px solid',
                                        borderColor: selectedCategoryIdFilter === cat.id.toString() ? 'transparent' : 'rgba(255,255,255,0.1)',
                                        transition: 'all 0.3s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {cat.name}
                                </button>
                            ))}


                            {categories.length > 7 && (
                                <div style={{ position: 'relative' }}>
                                    <button 
                                        onClick={() => setIsMoreCategoriesOpen(!isMoreCategoriesOpen)}
                                        style={{ 
                                            padding: '0.5rem 1.2rem', 
                                            borderRadius: '20px', 
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            background: 'rgba(174, 129, 255, 0.1)',
                                            color: 'var(--primary-color)',
                                            border: '1px solid rgba(174, 129, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        More <ChevronDown size={14} style={{ transform: isMoreCategoriesOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                                    </button>

                                    {isMoreCategoriesOpen && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: '100%', 
                                            right: 0, 
                                            marginTop: '0.5rem',
                                            width: '240px', 
                                            background: 'rgba(18, 18, 18, 0.95)', 
                                            backdropFilter: 'blur(15px)',
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: '15px', 
                                            padding: '0.8rem', 
                                            zIndex: 100,
                                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.4rem'
                                        }}>
                                            {categories.slice(7).map(cat => (
                                                <button 
                                                    key={cat.id}
                                                    onClick={() => {
                                                        setSelectedCategoryIdFilter(cat.id.toString());
                                                        setIsMoreCategoriesOpen(false);
                                                    }}
                                                    style={{ 
                                                        textAlign: 'left',
                                                        padding: '0.8rem 1rem', 
                                                        borderRadius: '10px', 
                                                        fontSize: '0.9rem',
                                                        background: selectedCategoryIdFilter === cat.id.toString() ? 'rgba(174, 129, 255, 0.1)' : 'transparent',
                                                        color: selectedCategoryIdFilter === cat.id.toString() ? 'var(--primary-color)' : 'var(--text-dim)',
                                                        border: 'none',
                                                        transition: 'all 0.2s ease',
                                                        fontWeight: selectedCategoryIdFilter === cat.id.toString() ? 600 : 400
                                                    }}
                                                >
                                                    {cat.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {allCourses.filter(c => 
                        (activeTab === 'learning' ? !c.is_archived : c.is_archived) && 
                        (selectedCategoryIdFilter === 'all' ? true : (selectedCategoryIdFilter === null ? c.category === null : c.category === parseInt(selectedCategoryIdFilter)))
                    ).length > 0 ? (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', 
                            gap: '2rem' 
                        }}>
                            {allCourses
                                .filter(c => 
                                    (activeTab === 'learning' ? !c.is_archived : c.is_archived) && 
                                    (selectedCategoryIdFilter === 'all' ? true : (selectedCategoryIdFilter === null ? c.category === null : c.category === parseInt(selectedCategoryIdFilter)))
                                )
                                .map((course) => (
                                    <div 
                                        key={course.id} 
                                        className="category-card" 
                                        style={{ 
                                            padding: '1.5rem', 
                                            display: 'flex', 
                                            gap: '1.5rem', 
                                            alignItems: 'center',
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => router.push(`/course/${course.id}`)}
                                    >
                                        <img 
                                            src={course.thumbnail_url} 
                                            alt={course.title} 
                                            style={{ 
                                                width: '180px', 
                                                height: '100px', 
                                                borderRadius: '12px', 
                                                objectFit: 'cover',
                                                flexShrink: 0
                                            }} 
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                                                <h4 style={{ 
                                                    fontSize: '1.1rem', 
                                                    margin: 0, 
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    lineHeight: '1.4',
                                                    fontWeight: 600
                                                }}>
                                                    {course.title}
                                                </h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '20px', flexShrink: 0 }}>
                                                    <Clock size={12} /> {formatDuration(course.total_duration)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                <div style={{ flex: 1, height: '6px', background: '#222', borderRadius: '3px' }}>
                                                    <div style={{ width: `${course.progress_percentage}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '3px' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', minWidth: '40px' }}>
                                                    {course.progress_percentage}%
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                                                <button 
                                                    className="btn-primary" 
                                                    style={{ margin: 0, padding: '0.5rem 1.2rem', fontSize: '0.8rem', width: 'auto', height: '36px', display: 'flex', alignItems: 'center' }}
                                                    onClick={(e) => {
                                                        if (course.is_archived) {
                                                            e.stopPropagation();
                                                            handleToggleArchiveCourse(course.id, true);
                                                        }
                                                    }}
                                                >
                                                    {course.is_archived ? 'Unarchive' : (course.progress_percentage > 0 ? 'Resume Learning' : 'Start Learning')}
                                                </button>
                                                {!course.is_archived && (
                                                    <button 
                                                        title="Archive Course"
                                                        style={{ margin: 0, padding: '0.5rem', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-dim)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleArchiveCourse(course.id, false);
                                                        }}
                                                    >
                                                        <Archive size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '4rem', 
                            background: 'rgba(255,255,255,0.01)', 
                            borderRadius: '24px', 
                            border: '1px dashed var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>
                                {activeTab === 'learning' ? 'No active courses found in this category.' : 'No archived courses found in this category.'}
                            </p>
                            {activeTab === 'learning' && selectedCategoryIdFilter === 'all' && (
                                <button 
                                    className="btn-primary" 
                                    style={{ width: 'auto', padding: '0.8rem 2rem', marginTop: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => setIsCourseModalOpen(true)}
                                >
                                    <Plus size={18} /> Add Course
                                </button>
                            )}
                            {selectedCategoryIdFilter !== 'all' && (
                                <button 
                                    className="btn-primary" 
                                    style={{ width: 'auto', padding: '0.5rem 1.5rem', marginTop: '0.5rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: '#fff' }}
                                    onClick={() => setSelectedCategoryIdFilter('all')}
                                >
                                    Clear Filter
                                </button>
                            )}
                        </div>
                    )}

                </section>
            )}
                </div>

                {/* Right Sidebar - Analytics & Tools (Only on learning/archived tabs) */}
                <Sidebar 
                    activeTab={activeTab}
                    currentMonth={currentMonth}
                    setCurrentMonth={setCurrentMonth}
                    checkIns={checkIns}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    todos={todos}
                    handleAddTodo={handleAddTodo}
                    newTodo={newTodo}
                    setNewTodo={setNewTodo}
                    toggleTodo={toggleTodo}
                    deleteTodo={deleteTodo}
                />
            </div>
            {activeTab === 'manage' && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '260px 1fr', 
                    gap: '1.5rem', 
                    flex: 1, 
                    marginBottom: '0',
                    minHeight: '500px' // Ensure some minimum height
                }}>


                    {/* Categories Column */}
                    <div className="auth-card glass-menu" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', maxWidth: 'none' }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <Folder size={22} style={{ color: 'var(--primary-color)' }} /> Categories
                        </h3>
                        
                        <button 
                            onClick={() => setIsAddCategoryModalOpen(true)}
                            className="add-category-btn" 
                            style={{ 
                                width: '100%', 
                                marginBottom: '2rem', 
                                padding: '1rem', 
                                border: '1px dashed var(--border-color)', 
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.8rem',
                                color: 'var(--text-dim)',
                                fontWeight: 600,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Plus size={18} /> Add New Category
                        </button>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '5px' }}>
                            <div 
                                onClick={() => setSelectedManageCategoryId('all')}
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '0.8rem 1rem', 
                                    background: selectedManageCategoryId === 'all' ? 'rgba(174, 129, 255, 0.1)' : 'rgba(255,255,255,0.03)', 
                                    borderRadius: '12px', 
                                    border: `1px solid ${selectedManageCategoryId === 'all' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: selectedManageCategoryId === 'all' ? 'var(--primary-color)' : '#fff' }}>All Courses</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{allCourses.filter(c => !c.is_archived).length} courses</p>
                                </div>
                            </div>

                            <div 
                                onClick={() => setSelectedManageCategoryId('none')}
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '0.8rem 1rem', 
                                    background: selectedManageCategoryId === 'none' ? 'rgba(174, 129, 255, 0.1)' : 'rgba(255,255,255,0.03)', 
                                    borderRadius: '12px', 
                                    border: `1px solid ${selectedManageCategoryId === 'none' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: selectedManageCategoryId === 'none' ? 'var(--primary-color)' : '#fff' }}>Uncategorized</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{allCourses.filter(c => c.category === null).length} courses</p>
                                </div>
                            </div>

                            {categories.map(cat => (
                                <div 
                                    key={cat.id} 
                                    onClick={() => setSelectedManageCategoryId(cat.id.toString())}
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '0.8rem 1rem', 
                                        background: selectedManageCategoryId === cat.id.toString() ? 'rgba(174, 129, 255, 0.1)' : 'rgba(255,255,255,0.03)', 
                                        borderRadius: '12px', 
                                        border: `1px solid ${selectedManageCategoryId === cat.id.toString() ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedManageCategoryId === cat.id.toString() ? 'var(--primary-color)' : '#fff' }}>{cat.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{allCourses.filter(c => c.category === cat.id).length} courses</p>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCategory(cat.id);
                                        }}
                                        style={{ color: 'var(--danger-color)', padding: '0.4rem', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', opacity: 0.6 }}
                                        title="Delete Category"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Courses Column */}
                    <div className="auth-card glass-menu" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1.5rem', maxWidth: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.8rem', margin: 0 }}>
                                <GraduationCap size={22} style={{ color: 'var(--primary-color)' }} /> Courses
                            </h3>
                            
                            <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginRight: '1rem' }}>
                                    Showing: <span style={{ color: '#fff', fontWeight: 600 }}>
                                        {selectedManageCategoryId === 'all' ? 'All Library' : 
                                         selectedManageCategoryId === 'none' ? 'Uncategorized' : 
                                         categories.find(c => c.id.toString() === selectedManageCategoryId)?.name}
                                    </span>
                                </div>
                                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input 
                                        type="text" 
                                        className="auth-modal-input" 
                                        style={{ margin: 0, padding: '0.7rem 1rem 0.7rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#fff', width: '100%', fontSize: '0.9rem' }}
                                        placeholder="Search within selection..."
                                        value={courseSearchQuery}
                                        onChange={(e) => setCourseSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bulk Actions Floating Bar (Conditional) */}
                        {selectedCourseIds.length > 0 && (
                            <div style={{ 
                                marginBottom: '2rem', 
                                display: 'flex', 
                                gap: '1.5rem', 
                                alignItems: 'center', 
                                background: 'var(--primary-gradient)', 
                                padding: '1rem 1.5rem', 
                                borderRadius: '15px', 
                                color: '#000',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}>
                                <span>{selectedCourseIds.length} Selected</span>
                                
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <select 
                                        onChange={(e) => handleBulkMoveCourses(e.target.value)}
                                        style={{ background: 'rgba(0,0,0,0.2)', color: '#000', border: '1px solid rgba(0,0,0,0.1)', padding: '0.4rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}
                                        value=""
                                    >
                                        <option value="" disabled>Move to Category...</option>
                                        <option value="none">Uncategorized (Clear)</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>

                                    <button onClick={() => handleBulkArchiveCourses(true)} style={{ color: '#000', background: 'rgba(255,255,255,0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>Archive Selected</button>
                                    <button onClick={() => handleBulkArchiveCourses(false)} style={{ color: '#000', background: 'rgba(255,255,255,0.2)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>Restore Selected</button>
                                    <button onClick={() => handleBulkDeleteCourses()} style={{ color: '#fff', background: 'var(--danger-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none' }}>Delete Selected</button>
                                </div>
                            </div>
                        )}

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '10px' }}>
                            {allCourses
                                .filter(c => {
                                    if (selectedManageCategoryId === 'all') return true;
                                    if (selectedManageCategoryId === 'none') return c.category === null;
                                    return c.category === parseInt(selectedManageCategoryId);
                                })
                                .filter(c => c.title.toLowerCase().includes(courseSearchQuery.toLowerCase()))
                                .map(course => {
                                    const isSelected = selectedCourseIds.includes(course.id);
                                    const cat = categories.find(c => c.id === course.category);
                                    
                                    return (
                                        <div 
                                            key={course.id} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '1.5rem', 
                                                padding: '1rem', 
                                                background: isSelected ? 'rgba(174, 129, 255, 0.08)' : 'rgba(255,255,255,0.02)', 
                                                borderRadius: '12px', 
                                                border: isSelected ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.05)',
                                                transition: 'all 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                if (isSelected) setSelectedCourseIds(selectedCourseIds.filter(id => id !== course.id));
                                                else setSelectedCourseIds([...selectedCourseIds, course.id]);
                                            }}
                                        >
                                            <div style={{ 
                                                width: '20px', 
                                                height: '20px', 
                                                borderRadius: '6px', 
                                                border: `2px solid ${isSelected ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)'}`,
                                                background: isSelected ? 'var(--primary-color)' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {isSelected && <X size={14} color="#000" />}
                                            </div>
                                            
                                            <img src={course.thumbnail_url} style={{ width: '100px', height: '56px', borderRadius: '8px', objectFit: 'cover' }} />
                                            
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <p style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>
                                                        {course.title} {course.is_archived && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>ARCHIVED</span>}
                                                    </p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                                                        <Clock size={12} /> {formatDuration(course.total_duration)}
                                                    </div>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                                                    Category: <span style={{ color: cat ? 'var(--primary-color)' : 'inherit' }}>{cat?.name || 'Uncategorized'}</span> • {course.progress_percentage}% Completed
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            )}

            {/* Import Course Modal */}
            {isCourseModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
                    <div className="auth-card glass-menu" style={{ maxWidth: '500px' }}>
                        <h2 className="gradient-text" style={{ marginBottom: '1rem' }}>Import YouTube Playlist</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Enter the URL or ID of the YouTube playlist you want to add to this category.</p>
                        
                        <form onSubmit={handleImportCourse}>
                            <div className="form-group">
                                <label>Playlist URL or ID</label>
                                <input 
                                    type="text" 
                                    placeholder="https://www.youtube.com/playlist?list=..."
                                    value={playlistUrl}
                                    onChange={(e) => setPlaylistUrl(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Course Name (Optional)</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter custom title (overrides YouTube title)"
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                />
                            </div>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Target Category</label>
                                <select 
                                    value={selectedCategoryId || ''}
                                    onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                                    style={{ width: '100%', padding: '0.8rem', background: '#1a1a1a', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#fff' }}
                                >
                                    <option value="">None (General Library)</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                <button 
                                    type="button" 
                                    className="btn-primary" 
                                    style={{ background: 'transparent', color: '#fff', border: '1px solid var(--border-color)' }}
                                    onClick={() => {
                                        setIsCourseModalOpen(false);
                                        setPlaylistUrl('');
                                        setCourseTitle('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isImporting}>
                                    {isImporting ? 'Importing...' : 'Add Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Category Modal */}
            {isAddCategoryModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }}>
                    <div className="auth-card glass-menu" style={{ maxWidth: '450px' }}>
                        <h2 className="gradient-text" style={{ marginBottom: '1rem' }}>Create New Category</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>Organize your learning path by grouping courses into a new subject.</p>
                        
                        <form onSubmit={handleAddCategory}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input 
                                    type="text" 
                                    className="auth-modal-input"
                                    placeholder="e.g. Artificial Intelligence, Web Dev..."
                                    value={newCategoryName}
                                    onChange={(e) => {
                                        setNewCategoryName(e.target.value);
                                        setCategoryError(''); // Clear error on type
                                    }}
                                    autoFocus

                                    required
                                />
                                {categoryError && <p className="error-message" style={{ margin: '0.8rem 0 0', textAlign: 'left' }}>{categoryError}</p>}
                            </div>


                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button 
                                    type="button" 
                                    className="btn-primary" 
                                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: '#fff' }}
                                    onClick={() => {
                                        setIsAddCategoryModalOpen(false);
                                        setCategoryError('');
                                    }}
                                >

                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="container" style={{ paddingTop: '2rem' }}>Loading Dashboard...</div>}>
            <Dashboard />
        </Suspense>
    );
}
