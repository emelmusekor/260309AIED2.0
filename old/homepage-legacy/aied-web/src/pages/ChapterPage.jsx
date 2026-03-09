import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chaptersData } from '../data/ContentData';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ChapterPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const chapter = chaptersData.find(c => c.id === id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!chapter) return (
        <div className="container" style={{ paddingTop: '200px', textAlign: 'center', minHeight: '80vh' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>챕터를 찾을 수 없습니다.</h2>
            <button
                onClick={() => navigate('/')}
                style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 600 }}
            >
                홈으로 돌아가기
            </button>
        </div>
    );

    return (
        <div className="container" style={{ paddingTop: '140px', paddingBottom: '100px', minHeight: '100vh', animation: 'fadeIn 0.8s ease' }}>
            <button
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '3rem', fontSize: '1.1rem', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.color = '#fff'}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            >
                <ArrowLeft size={22} /> 다시 생태계 탐험으로
            </button>

            <div className="glass" style={{ padding: '5rem', borderRadius: '40px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
                {/* Decorative background glow matched to chapter color */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px', background: chapter.color, filter: 'blur(150px)', opacity: 0.15, pointerEvents: 'none', borderRadius: '50%' }}></div>

                <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em', textShadow: `0 0 30px ${chapter.color}40` }}>{chapter.title}</h1>
                <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.8)', maxWidth: '800px', marginBottom: '5rem', lineHeight: 1.6 }}>{chapter.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '5rem', position: 'relative', zIndex: 1 }}>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: `2px solid ${chapter.color}50`, paddingBottom: '1rem', color: '#fff' }}>작동 원리 및 개념</h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {chapter.details.principles.map((p, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    <CheckCircle2 color={chapter.color} size={28} style={{ flexShrink: 0, filter: `drop-shadow(0 0 10px ${chapter.color}80)` }} />
                                    <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, paddingTop: '2px' }}>{p}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: `2px solid ${chapter.color}50`, paddingBottom: '1rem', color: '#fff' }}>주요 활용 분야</h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {chapter.details.applications.map((p, i) => (
                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                    <CheckCircle2 color={chapter.color} size={28} style={{ flexShrink: 0, filter: `drop-shadow(0 0 10px ${chapter.color}80)` }} />
                                    <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, paddingTop: '2px' }}>{p}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

                <div style={{ marginTop: '5rem', background: 'rgba(0,0,0,0.4)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>대표 도구 (Tools)</h3>
                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                        {chapter.details.tools.map((t, i) => (
                            <span key={i} style={{ background: `${chapter.color}15`, color: '#fff', padding: '12px 24px', borderRadius: '999px', fontSize: '1.1rem', fontWeight: 600, border: `1px solid ${chapter.color}50`, boxShadow: `0 4px 20px ${chapter.color}20` }}>
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
