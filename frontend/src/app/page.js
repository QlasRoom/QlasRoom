'use client';

import { useRouter } from 'next/navigation';
import { 
    Activity, 
    Target, 
    Archive, 
    FolderTree, 
    TrendingUp, 
    Wrench 
} from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();

    return (
        <div style={{ color: '#fff' }}>
            {/* Ambient Background */}
            <div className="landing-bg"></div>

            {/* Features Section - Main Entry */}
            <section style={{ padding: '6rem 5% 8rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '8rem' }}>
                    <h1 className="gradient-text" style={{ fontSize: '3.2rem', fontWeight: 800, maxWidth: '900px', margin: '0 auto', letterSpacing: '-1.5px', lineHeight: 1.2 }}>
                        Queue the Learning, <br /> Cut the Noise.
                    </h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem', maxWidth: '1400px', margin: '0 auto' }}>
                    {[
                        { title: 'The Heartbeat', desc: 'Auto-syncs your progress every 10 seconds. Close the tab, pick up right where you left off.', icon: <Activity size={28} /> },
                        { title: 'Zero Distractions', desc: 'Focus strictly on your course materials without YouTube recommendations or comments.', icon: <Target size={28} /> },
                        { title: 'Smart Archive', desc: 'Archive courses you\'ve finished to keep your dashboard clean and focused on what\'s next.', icon: <Archive size={28} /> },
                        { title: 'Topic Categories', desc: 'Curate your own university subjects. Group playlists into meaningful educational paths.', icon: <FolderTree size={28} /> },
                        { title: 'Global Progress', desc: 'Track your overall learning journey with visual breakdowns of each category and course.', icon: <TrendingUp size={28} /> },
                        { title: 'Bulk Management', desc: 'Mass-move or delete courses. High-efficiency tools for large educational libraries.', icon: <Wrench size={28} /> },
                    ].map((f, i) => (
                        <div key={i} className="feature-grid-card">
                            <div className="feature-icon" style={{ color: '#000' }}>{f.icon}</div>
                            <h3 style={{ fontSize: '1.7rem', marginBottom: '1rem', fontWeight: 700 }}>{f.title}</h3>
                            <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, fontSize: '1.05rem' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tagline Divider */}
            <div style={{ padding: '4rem 5%', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '2px', background: 'var(--primary-gradient)', filter: 'blur(30px)', opacity: 0.3 }}></div>
                <p className="gradient-text" style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '6px', position: 'relative', zIndex: 1 }}>
                    Powering the next generation of self-taught experts
                </p>
            </div>


            {/* Final CTA */}
            <section style={{ padding: '12rem 5% 0rem', textAlign: 'center', marginBottom: '8rem' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'var(--primary-gradient)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }}></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '2rem', letterSpacing: '-1px' }}>Ready to start your journey?</h2>
                        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                            <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem' }}>Experience the distraction-free university today. Sign up at the top to begin.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
