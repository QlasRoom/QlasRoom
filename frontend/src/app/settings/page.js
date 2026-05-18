'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, AtSign, Settings, Save, Shield, ArrowLeft } from 'lucide-react';
import api from '@/services/api';

export default function SettingsPage() {
    const [user, setUser] = useState({
        first_name: '',
        last_name: '',
        email: '',
        username: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isMobile, setIsMobile] = useState(false);
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
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await api.get('/me/');
            setUser(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch user:', err);
            setError('Failed to load profile data.');
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await api.patch('/me/', user);
            setUser(response.data);
            setSuccess('Profile updated successfully!');
            // Dispatch event to update navbar user info
            window.dispatchEvent(new Event('auth-change'));
        } catch (err) {
            console.error('Update failed:', err);
            setError(err.response?.data?.detail || 'Failed to update profile. Please check the fields.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="auth-container">
                <div className="loader"></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ 
            paddingTop: '1.5rem', 
            paddingBottom: isMobile ? '100px' : '4rem',
            paddingLeft: isMobile ? '1.2rem' : '3rem',
            paddingRight: isMobile ? '1.2rem' : '3rem'
        }}>

            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: isMobile ? '1.5rem' : '3rem' }}>
                    <button 
                        onClick={() => router.back()}
                        style={{ 
                            padding: '0.8rem', 
                            borderRadius: '12px', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-dim)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.4rem', fontWeight: 800, margin: 0 }}>
                            Account <span className="gradient-text">Settings</span>
                        </h1>
                        <p style={{ color: 'var(--text-dim)', fontSize: isMobile ? '0.9rem' : '1.05rem', margin: '0.2rem 0 0 0' }}>Manage your personal information.</p>
                    </div>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', 
                    gap: isMobile ? '1.5rem' : '2.5rem',
                    alignItems: 'start'
                }}>
                    
                    {/* Sidebar Profile Card */}
                    <div className="category-card" style={{ padding: isMobile ? '1.5rem' : '2.5rem', textAlign: 'center' }}>
                        <div style={{ 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '50%', 
                            background: 'var(--primary-gradient)', 
                            margin: '0 auto 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            color: '#000',
                            border: '4px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 10px 20px rgba(174, 129, 255, 0.2)'
                        }}>
                            {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                        </div>
                        <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.4rem' }}>
                            {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '2rem' }}>{user.email}</p>
                        
                        <div style={{ textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary-color)', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 600 }}>
                                <Settings size={18} /> General
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-dim)', opacity: 0.5, fontSize: '0.95rem', cursor: 'not-allowed' }}>
                                <Shield size={18} /> Password & Security
                            </div>
                        </div>
                    </div>

                    {/* Main Settings Form */}
                    <div className="category-card" style={{ padding: isMobile ? '1.5rem' : '3rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            Personal Information
                        </h2>

                        {error && (
                            <div style={{ 
                                background: 'rgba(249, 38, 114, 0.1)', 
                                border: '1px solid var(--danger-color)', 
                                color: 'var(--danger-color)', 
                                padding: '1rem', 
                                borderRadius: '12px', 
                                marginBottom: '2rem',
                                fontSize: '0.9rem'
                            }}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{ 
                                background: 'rgba(166, 226, 46, 0.1)', 
                                border: '1px solid var(--secondary-color)', 
                                color: 'var(--secondary-color)', 
                                padding: '1rem', 
                                borderRadius: '12px', 
                                marginBottom: '2rem',
                                fontSize: '0.9rem'
                            }}>
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>
                                <div className="form-group">
                                    <label>First Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input 
                                            type="text" 
                                            name="first_name"
                                            value={user.first_name}
                                            onChange={handleChange}
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Enter first name"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                        <input 
                                            type="text" 
                                            name="last_name"
                                            value={user.last_name}
                                            onChange={handleChange}
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Enter last name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Username
                                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', opacity: 0.8 }}>Account ID (read-only)</span>
                                </label>
                                <div style={{ position: 'relative', opacity: 0.6 }}>
                                    <AtSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input 
                                        type="text" 
                                        name="username"
                                        value={user.username}
                                        onChange={handleChange}
                                        style={{ paddingLeft: '3rem', cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                                        placeholder="Enter username"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Email Address
                                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', opacity: 0.8 }}>Primary account email (read-only)</span>
                                </label>
                                <div style={{ position: 'relative', opacity: 0.6 }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={user.email}
                                        onChange={handleChange}
                                        style={{ paddingLeft: '3rem', cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)' }}
                                        placeholder="Enter email address"
                                        disabled
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem' }}>
                                <button 
                                    type="submit" 
                                    className="btn-primary" 
                                    disabled={saving}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '0.8rem',
                                        height: '56px',
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    {saving ? (
                                        'Saving Changes...'
                                    ) : (
                                        <>
                                            <Save size={20} /> Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .loader {
                    border: 3px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    border-top: 3px solid var(--primary-color);
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
