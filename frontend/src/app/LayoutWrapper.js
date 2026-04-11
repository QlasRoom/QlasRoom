'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();
    
    // Distraction-free mode for the course player
    const isPlayerPage = pathname.startsWith('/course/');
    
    // Use an environment variable for the Client ID
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER';
    
    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {!isPlayerPage && <Navbar />}
                <main style={{ flex: 1, paddingTop: !isPlayerPage ? '80px' : '0' }}>
                    {children}
                </main>
                {!isPlayerPage && <Footer />}
            </div>
        </GoogleOAuthProvider>

    );
}
