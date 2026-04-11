'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmail() {
    const { uidb64, token } = useParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');
    const router = useRouter();

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await api.get(`/verify-email/${uidb64}/${token}/`);
                setStatus('success');
                setMessage(response.data.message);
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
            }
        };

        if (uidb64 && token) {
            verify();
        }
    }, [uidb64, token]);

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    {status === 'verifying' && (
                        <Loader2 className="animate-spin" size={64} style={{ margin: '0 auto', color: 'var(--primary-color)' }} />
                    )}
                    {status === 'success' && (
                        <CheckCircle size={64} style={{ margin: '0 auto', color: 'var(--secondary-color)' }} />
                    )}
                    {status === 'error' && (
                        <XCircle size={64} style={{ margin: '0 auto', color: 'var(--danger-color)' }} />
                    )}
                </div>

                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {status === 'verifying' ? 'Verifying...' : status === 'success' ? 'Email Verified!' : 'Verification Failed'}
                </h1>
                
                <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                    {status === 'verifying' ? 'Please wait while we confirm your email address.' : message}
                </p>

                {status !== 'verifying' && (
                    <Link href="/" passHref>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                            {status === 'success' ? 'Go to Login' : 'Back to Home'} <ArrowRight size={20} />
                        </button>
                    </Link>
                )}
            </div>

            <style jsx>{`
                .animate-spin {
                    animation: spin 1.5s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
