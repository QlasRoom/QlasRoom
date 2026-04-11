'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, LogIn, UserPlus, Github, Mail, Lock, User } from 'lucide-react';
import api from '@/services/api';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
    const [mode, setMode] = useState(initialMode);
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const router = useRouter();

    // Sync mode with initialMode when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setError('');
            setSuccessMsg('');
            setFormData({ username: '', email: '', password: '' });
        }
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            if (mode === 'login') {
                const response = await api.post('/token/', { 
                    username: formData.username, 
                    password: formData.password 
                });
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                window.dispatchEvent(new CustomEvent('auth-change'));
                onClose();
                router.push('/dashboard');
            } else {
                const response = await api.post('/register/', formData);
                setSuccessMsg(response.data.message || 'Account created! Please check your email to verify your account.');
                setMode('login');
                setFormData({ ...formData, password: '' });
            }
        } catch (err) {
            console.error('Auth error:', err);
            const msg = err.response?.data?.error || 
                        Object.values(err.response?.data || {}).flat()[0] || 
                        'Authentication failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/google-login/', { 
                credential: credentialResponse.credential 
            });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            window.dispatchEvent(new CustomEvent('auth-change'));
            onClose();
            router.push('/dashboard');
        } catch (err) {
            console.error('Google Auth error:', err);
            setError(err.response?.data?.error || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div 
            onClick={handleBackdropClick}
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: 'rgba(0,0,0,0.85)', 
                backdropFilter: 'blur(12px)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                zIndex: 9999,
                padding: '2rem 1rem',
                overflowY: 'auto'
            }}
        >
            <div 
                className="glass-menu"
                style={{ 
                    width: '100%',
                    maxWidth: '450px',
                    padding: '3rem 2.5rem',
                    borderRadius: '30px',
                    position: 'relative',
                    animation: 'modalSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    margin: 'auto' /* Ensures centering while allowing scrolling */
                }}
            >
                <button 
                    onClick={onClose}
                    style={{ 
                        position: 'absolute', 
                        top: '1.5rem', 
                        right: '1.5rem', 
                        color: 'var(--text-dim)',
                        transition: 'color 0.3s ease'
                    }}
                >
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: 'var(--primary-gradient)', 
                        borderRadius: '20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 10px 20px rgba(174, 129, 255, 0.3)'
                    }}>
                        {mode === 'login' ? <LogIn size={28} color="#000" /> : <UserPlus size={28} color="#000" />}
                    </div>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800 }}>
                        {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                        {mode === 'login' ? 'Enter your details to continue learning.' : 'Join the next generation of self-taught experts.'}
                    </p>
                </div>

                {successMsg && (
                    <div style={{ 
                        padding: '1rem', 
                        background: 'rgba(166, 226, 46, 0.1)', 
                        border: '1px solid rgba(166, 226, 46, 0.2)', 
                        borderRadius: '12px', 
                        color: 'var(--secondary-color)',
                        fontSize: '0.9rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input 
                                className="auth-modal-input"
                                type="text"
                                placeholder="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                style={{ paddingLeft: '3rem' }}
                                required
                            />
                        </div>
                    </div>

                    {mode === 'signup' && (
                        <div className="form-group" style={{ margin: 0 }}>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                                <input 
                                    className="auth-modal-input"
                                    type="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    style={{ paddingLeft: '3.2rem' }}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group" style={{ margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                            <input 
                                className="auth-modal-input"
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                style={{ paddingLeft: '3rem' }}
                                required
                            />
                        </div>
                    </div>

                    {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ height: '55px', fontSize: '1.1rem', marginTop: '1rem' }}>
                        {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', gap: '1rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-in failed.')}
                            theme="filled_black"
                            shape="pill"
                            width="350px"
                        />
                    </div>
                </form>

                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-dim)' }}>
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <span 
                        onClick={() => {
                            setMode(mode === 'login' ? 'signup' : 'login');
                            setError('');
                            setSuccessMsg('');
                        }}
                        style={{ color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </span>
                </p>
            </div>

            <style jsx>{`
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
