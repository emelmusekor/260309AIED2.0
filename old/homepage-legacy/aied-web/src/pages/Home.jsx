import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { chaptersData } from '../data/ContentData';
import { Layers, Zap, Brain, Rocket, MessageSquare, Image, Music, Video, Code, Shield, Sparkles } from 'lucide-react';

const iconMap = {
    text: MessageSquare,
    image: Image,
    audio: Music,
    video: Video,
    code: Code,
    ethics: Shield
};

function FadeInSection({ children, delay = 0 }) {
    const domRef = useRef();
    const [isVisible, setVisible] = React.useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setVisible(true);
            }
        }, { threshold: 0.1 });

        if (domRef.current) {
            observer.observe(domRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={domRef}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`
            }}
        >
            {children}
        </div>
    );
}

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            {/* Hero */}
            <section className={styles.hero}>
                <FadeInSection>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
                        <Sparkles size={16} color="#8b5cf6" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Next-Gen Education Model</span>
                    </div>
                    <h1 className={styles.title}>AI Education 2.0</h1>
                    <p className={styles.subtitle}>
                        컴퓨팅 사고력을 넘어 AI 사고력으로.<br />
                        추상화에서 자율화에 이르는 지능의 진화 과정을 탐험하세요.
                    </p>
                </FadeInSection>
            </section>

            {/* Pillars */}
            <div className="container">
                {/* Abstraction */}
                <section className={styles.section}>
                    <div className={styles.sectionContent}>
                        <FadeInSection>
                            <div className={styles.textBlock}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <Layers size={36} color="#ec4899" />
                                    <h2 style={{ color: '#ec4899', margin: 0 }}>추상화 (Abstraction)</h2>
                                </div>
                                <h3>모든 자동화는 추상화를 필요로 합니다.</h3>
                                <p>
                                    컴퓨터는 현실의 모호한 개념을 직접 처리할 수 없습니다. 문제의 핵심 변수를
                                    추출하고 불필요한 것을 제거하는 '추상화' 작업이 선행되어야 시스템이 이해할 수 있습니다.
                                </p>
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <div className={styles.visualBlock}>
                                <div style={{ width: '60%', height: '60%', border: '2px dashed rgba(236,72,153,0.4)', borderRadius: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(236,72,153,0.05)' }}>
                                    <div style={{ width: '60px', height: '60px', background: '#ec4899', borderRadius: '16px', boxShadow: '0 0 30px rgba(236,72,153,0.6)', animation: 'pulse 2s infinite' }}></div>
                                </div>
                            </div>
                        </FadeInSection>
                    </div>
                </section>

                {/* Automation */}
                <section className={styles.section}>
                    <div className={`${styles.sectionContent} ${styles.sectionReverse}`}>
                        <FadeInSection>
                            <div className={styles.textBlock}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <Zap size={36} color="#8b5cf6" />
                                    <h2 style={{ color: '#8b5cf6', margin: 0 }}>자동화 (Automation)</h2>
                                </div>
                                <h3>모든 지능화는 자동화를 필요로 합니다.</h3>
                                <p>
                                    추상화된 규칙들을 컴퓨터가 순차적으로 실행할 수 있도록 논리적 절차를 만드는 과정입니다.
                                    반복적이고 속도감 있는 처리는 인간의 한계를 넘어섭니다.
                                </p>
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <div className={styles.visualBlock}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} style={{ width: '12px', height: `${40 + i * 20}px`, background: '#8b5cf6', borderRadius: '6px', boxShadow: '0 0 20px rgba(139,92,246,0.5)', animation: `pulse 1.5s infinite ${i * 0.2}s` }}></div>
                                    ))}
                                </div>
                            </div>
                        </FadeInSection>
                    </div>
                </section>

                {/* Intelligence */}
                <section className={styles.section}>
                    <div className={styles.sectionContent}>
                        <FadeInSection>
                            <div className={styles.textBlock}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <Brain size={36} color="#3b82f6" />
                                    <h2 style={{ color: '#3b82f6', margin: 0 }}>지능화 (Intelligence)</h2>
                                </div>
                                <h3>모든 자율화는 지능화를 필요로 합니다.</h3>
                                <p>
                                    단순한 규칙 실행을 넘어, 방대한 데이터 속에서 스스로 패턴을 학습하고 예측합니다.
                                    정답을 가르쳐주지 않아도 특징을 인지하며 통찰력을 발휘하는 단계입니다.
                                </p>
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <div className={styles.visualBlock}>
                                <Brain size={100} color="#3b82f6" style={{ animation: 'pulse 3s infinite', filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.6))' }} />
                                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)' }}></div>
                            </div>
                        </FadeInSection>
                    </div>
                </section>

                {/* Autonomy */}
                <section className={styles.section}>
                    <div className={`${styles.sectionContent} ${styles.sectionReverse}`}>
                        <FadeInSection>
                            <div className={styles.textBlock}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                    <Rocket size={36} color="#10b981" />
                                    <h2 style={{ color: '#10b981', margin: 0 }}>자율화 (Autonomy)</h2>
                                </div>
                                <h3>AI 교육 2.0의 최종 단계</h3>
                                <p>
                                    예측 불가능한 환경에서도 스스로 판단하고 최적의 결정을 내립니다. 인간은 AI와 "메타 협력"하여 공생하며 더 큰 목표를 향해 생태계를 확장합니다.
                                </p>
                            </div>
                        </FadeInSection>
                        <FadeInSection delay={0.2}>
                            <div className={styles.visualBlock}>
                                <Rocket size={100} color="#10b981" style={{ transform: 'rotate(45deg)', animation: 'pulse 2s infinite', filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.6))' }} />
                                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 60%)' }}></div>
                            </div>
                        </FadeInSection>
                    </div>
                </section>

                {/* Chapters Hub */}
                <section className={styles.chaptersSection}>
                    <FadeInSection>
                        <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontWeight: 800 }} className="gradient-text">생성형 AI 생태계 탐험</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                            디지터시(Digitacy)를 갖춘 인재로 거듭나기 위해, 인간의 한계를 넘어서는 다양한 멀티모달 생성형 AI 원리와 실사례를 확인하세요.
                        </p>
                    </FadeInSection>

                    <div className={styles.chaptersGrid}>
                        {chaptersData.map((chapter, idx) => {
                            const Icon = iconMap[chapter.id];
                            return (
                                <FadeInSection key={chapter.id} delay={idx * 0.1}>
                                    <div
                                        className={`${styles.chapterCard} glass`}
                                        onClick={() => navigate(`/chapter/${chapter.id}`)}
                                    >
                                        <div className={styles.cardIcon}>
                                            <Icon size={40} color={chapter.color} />
                                        </div>
                                        <h3 className={styles.cardTitle}>{chapter.title}</h3>
                                        <p className={styles.cardDesc}>{chapter.excerpt}</p>
                                        <div style={{ marginTop: '2rem', color: chapter.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                            자세히 보기 &rarr;
                                        </div>
                                    </div>
                                </FadeInSection>
                            )
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
