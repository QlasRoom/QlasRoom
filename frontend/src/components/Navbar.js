'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, LogOut, Settings, BarChart3, Folder, BookOpen, GraduationCap, User, Archive, Sliders } from 'lucide-react';
import api from '@/services/api';
import AuthModal from './AuthModal';

export default function Navbar({ onAddCourse }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const router = useRouter();
    const profileRef = useRef(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        checkAuth();
        // Listen for storage changes (for logout in other tabs)
        window.addEventListener('storage', checkAuth);
        // Listen for local auth changes (same tab)
        window.addEventListener('auth-change', checkAuth);
        
        // Handle query params for auth
        const authParam = searchParams.get('auth');
        if (authParam === 'login' && !isLoggedIn) {
            setAuthMode('login');
            setIsAuthModalOpen(true);
        } else if (authParam === 'signup' && !isLoggedIn) {
            setAuthMode('signup');
            setIsAuthModalOpen(true);
        }

        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth-change', checkAuth);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [searchParams, isLoggedIn]);

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsLoggedIn(true);
            try {
                const response = await api.get('/me/');
                setUser(response.data);
            } catch (err) {
                console.error('Failed to fetch user:', err.response?.status, err.response?.data || err.message);
                setIsLoggedIn(false);
            }
        } else {
            setIsLoggedIn(false);
            setUser(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsLoggedIn(false);
        setUser(null);
        setIsProfileOpen(false);
        router.push('/');
    };

    return (
        <>
        <nav style={{ 
            padding: '1rem 5%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(5, 5, 5, 0.4)',
            backdropFilter: 'blur(20px)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            height: '80px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', height: '100%' }}>
                <div 
                    onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')}
                    className="logo gradient-text" 
                    style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-1px', cursor: 'pointer' }}
                >
                    QlasRoom
                </div>

                {/* Dashboard Tabs in Header */}
                {isLoggedIn && pathname === '/dashboard' && (
                    <div style={{ display: 'flex', gap: '1.5rem', alignSelf: 'stretch', alignItems: 'flex-end', paddingBottom: '2px' }}>
                        <button 
                            onClick={() => router.push('/dashboard?tab=learning')}
                            style={{ 
                                padding: '0 0.5rem 1rem 0.5rem', 
                                color: (searchParams.get('tab') || 'learning') === 'learning' ? 'var(--primary-color)' : 'var(--text-dim)',
                                borderTopWidth: 0,
                                borderLeftWidth: 0,
                                borderRightWidth: 0,
                                borderBottomWidth: (searchParams.get('tab') || 'learning') === 'learning' ? '2px' : '0px',
                                borderBottomStyle: 'solid',
                                borderBottomColor: (searchParams.get('tab') || 'learning') === 'learning' ? 'var(--primary-color)' : 'transparent',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                background: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <GraduationCap size={18} /> My Learning
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard?tab=archived')}
                            style={{ 
                                padding: '0 0.5rem 1rem 0.5rem', 
                                color: searchParams.get('tab') === 'archived' ? 'var(--primary-color)' : 'var(--text-dim)',
                                borderTopWidth: 0,
                                borderLeftWidth: 0,
                                borderRightWidth: 0,
                                borderBottomWidth: searchParams.get('tab') === 'archived' ? '2px' : '0px',
                                borderBottomStyle: 'solid',
                                borderBottomColor: searchParams.get('tab') === 'archived' ? 'var(--primary-color)' : 'transparent',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                background: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Archive size={18} /> Archived
                        </button>
                        <button 
                            onClick={() => router.push('/dashboard?tab=manage')}
                            style={{ 
                                padding: '0 0.5rem 1rem 0.5rem', 
                                color: searchParams.get('tab') === 'manage' ? 'var(--primary-color)' : 'var(--text-dim)',
                                borderTopWidth: 0,
                                borderLeftWidth: 0,
                                borderRightWidth: 0,
                                borderBottomWidth: searchParams.get('tab') === 'manage' ? '2px' : '0px',
                                borderBottomStyle: 'solid',
                                borderBottomColor: searchParams.get('tab') === 'manage' ? 'var(--primary-color)' : 'transparent',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                background: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Sliders size={18} /> Manage
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                {!isLoggedIn ? (
                    <>
                        <button 
                            onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                            className="btn-primary" 
                            style={{ width: 'auto', height: '40px', padding: '0 1.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                            className="btn-primary" 
                            style={{ width: 'auto', height: '40px', padding: '0 1.8rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            Sign Up
                        </button>
                    </>
                ) : (
                    <>
                        {pathname === '/' && (
                            <Link href="/dashboard" className="btn-primary" style={{ width: 'auto', height: '40px', padding: '0 1.8rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Go to Dashboard
                            </Link>
                        )}
                        
                        {/* Show "Add Course" if on dashboard or if onAddCourse prop (legacy) */}
                        {(pathname === '/dashboard' || onAddCourse) && (
                            <button 
                                className="btn-primary" 
                                style={{ width: 'auto', height: '40px', padding: '0 1.2rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                onClick={() => {
                                    if (onAddCourse) onAddCourse();
                                    else window.dispatchEvent(new CustomEvent('open-import-modal'));
                                }}
                            >
                                <Plus size={18} /> Add Course
                            </button>
                        )}

                        <div ref={profileRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <div 
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    background: 'var(--primary-gradient)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: '#000', 
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    flexShrink: 0
                                }}
                            >
                                {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
                            </div>

                            {isProfileOpen && (
                                <div className="glass-menu" style={{ 
                                    position: 'absolute', 
                                    top: '50px', 
                                    right: 0, 
                                    borderRadius: '12px', 
                                    width: '240px', 
                                    padding: '1rem',
                                    zIndex: 100,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                }}>
                                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                            {(user?.first_name || user?.last_name) ? `${user.first_name} ${user.last_name}`.trim() : user?.username}
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{user?.email || 'Student'}</p>
                                    </div>
                                    
                                    <button className="profile-dropdown-item" onClick={() => { setIsProfileOpen(false); router.push('/dashboard'); }}>
                                        <GraduationCap size={18} /> My Learning
                                    </button>
                                    
                                    <button className="profile-dropdown-item" onClick={() => { setIsProfileOpen(false); router.push('/dashboard?tab=archived'); }}>
                                        <Archive size={18} /> Archived Courses
                                    </button>

                                    
                                    {pathname === '/dashboard' && (
                                        <button 
                                            className="profile-dropdown-item"
                                            onClick={() => {
                                                setIsProfileOpen(false);
                                                router.push('/dashboard?tab=manage');
                                            }}
                                        >
                                            <Sliders size={18} /> Manage Library
                                        </button>
                                    )}

                                    <button className="profile-dropdown-item" onClick={() => { setIsProfileOpen(false); router.push('/settings'); }}>
                                        <Settings size={18} /> Settings
                                    </button>
                                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>
                                    <button 
                                        onClick={handleLogout} 
                                        className="profile-dropdown-item" 
                                        style={{ color: 'var(--danger-color)' }}
                                    >
                                        <LogOut size={18} /> Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </nav>

        <AuthModal 
            isOpen={isAuthModalOpen} 
            onClose={() => setIsAuthModalOpen(false)} 
            initialMode={authMode} 
        />
        </>
    );
}
