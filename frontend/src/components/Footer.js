import React from 'react';

export default function Footer() {
    return (
        <footer style={{ 
            padding: '1.5rem 5%', 
            borderTop: '1px solid rgba(255,255,255,0.05)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            background: '#050505',
            color: '#444', 
            fontSize: '0.9rem', 
            fontWeight: 500,
            zIndex: 10
        }}>
            <p>© 2026 QlasRoom. Built for serious learners.</p>
            <div style={{ display: 'flex', gap: '3rem' }}>
                <a href="#" style={{ transition: 'color 0.3s ease' }} className="footer-link">Privacy</a>
                <a href="#" style={{ transition: 'color 0.3s ease' }} className="footer-link">Github</a>
                <a href="#" style={{ transition: 'color 0.3s ease' }} className="footer-link">Twitter</a>
            </div>
            <style jsx>{`
                .footer-link:hover {
                    color: var(--primary-color);
                }
            `}</style>
        </footer>
    );
}
