'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.post('/register/', { username, email, password });
            setSuccessMessage(response.data.message || 'Registration successful! Please check your email.');
            // Don't redirect immediately so they can read the message
            // setTimeout(() => router.push('/?auth=login'), 5000);
        } catch (err) {
            setError(err.response?.data?.username || err.response?.data?.email || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="gradient-text">Join QlasRoom</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="johndoe"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <div className="success-banner">{successMessage}</div>}
                    
                    {!successMessage ? (
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    ) : (
                        <button type="button" className="btn-primary" onClick={() => router.push('/?auth=login')}>
                            Go to Login
                        </button>
                    )}
                </form>

                <p className="auth-link">
                    Already have an account? <Link href="/?auth=login"><span>Sign In</span></Link>
                </p>
            </div>
        </div>
    );
}
