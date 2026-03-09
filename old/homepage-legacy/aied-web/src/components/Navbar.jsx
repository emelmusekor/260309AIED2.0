import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="navbar glass">
            <div className="container nav-content">
                <Link to="/" className="brand">
                    <Sparkles className="brand-icon" size={24} />
                    <span className="brand-text gradient-text">AIED 2.0</span>
                </Link>
                <nav className="nav-links">
                    <Link to="/">Home</Link>
                </nav>
            </div>
        </header>
    );
}
