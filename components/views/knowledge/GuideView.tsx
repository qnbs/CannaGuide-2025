import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { KnowledgeArticle } from '@/types';
import { knowledgeBase } from '@/data/knowledgebase';
import { Speakable } from '@/components/common/Speakable';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

const GuideViewComponent: React.FC = () => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState<string>('');
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

    const getGroupInfo = (groupName: string): { icon: React.ReactNode; color: string; accentColor: string; } => {
        if (groupName === 'Phases') {
            return { icon: <PhosphorIcons.Plant />, color: 'text-secondary-400', accentColor: 'border-secondary-500' };
        }
        if (groupName === 'Troubleshooting') {
            return { icon: <PhosphorIcons.FirstAidKit />, color: 'text-danger', accentColor: 'border-danger' };
        }
        if (groupName === 'Core Concepts') {
            return { icon: <PhosphorIcons.Brain />, color: 'text-accent-400', accentColor: 'border-accent-500' };
        }
        return { icon: <PhosphorIcons.BookOpenText />, color: 'text-slate-400', accentColor: 'border-slate-500' };
    };

    const groupedArticles = useMemo(() => {
        const groups: Record<string, { order: number, name: string, articles: KnowledgeArticle[] }> = {
            'Phases': { order: 1, name: t('knowledgeView.guide.phases'), articles: [] },
            'Core Concepts': { order: 2, name: t('knowledgeView.guide.coreConcepts'), articles: [] },
            'Troubleshooting': { order: 3, name: t('knowledgeView.guide.troubleshooting'), articles: [] },
        };
    
        const groupNameMapping: Record<string, keyof typeof groups> = {
            'phase': 'Phases',
            'fix': 'Troubleshooting',
            'concept': 'Core Concepts',
        };
        
        knowledgeBase.forEach(article => {
            const match = article.id.match(/^(phase|fix|concept)/);
            if (match && match[1]) {
                const groupKey = groupNameMapping[match[1]];
                if (groupKey) {
                    groups[groupKey].articles.push(article);
                }
            }
        });
        
        // Sort articles within the 'Phases' group numerically by their title for correct order
        groups['Phases'].articles.sort((a, b) => {
            const aTitle = t(a.titleKey);
            const bTitle = t(b.titleKey);
            const aNum = parseInt(aTitle.match(/\d+/)?.[0] || '0');
            const bNum = parseInt(bTitle.match(/\d+/)?.[0] || '0');
            return aNum - bNum;
        });

        return Object.entries(groups)
            .filter(([, groupData]) => groupData.articles.length > 0)
            .sort((a, b) => a[1].order - b[1].order);
    }, [t]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            // This configuration makes the section active when its top edge enters the top 20% of the viewport.
            { rootMargin: '-20% 0px -80% 0px', threshold: 0 }
        );

        const currentRefs = sectionRefs.current;
        for (const key in currentRefs) {
            const ref = currentRefs[key];
            if (ref) observer.observe(ref);
        }

        return () => {
            for (const key in currentRefs) {
                const ref = currentRefs[key];
                if (ref) observer.unobserve(ref);
            }
        };
    }, [groupedArticles]);

    useEffect(() => {
        if (groupedArticles.length > 0 && !activeSection) {
            setActiveSection(groupedArticles[0][0]);
        }
    }, [groupedArticles, activeSection]);

    const scrollToSection = (id: string) => {
        sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <aside className="hidden md:block md:col-span-4 lg:col-span-3">
                <div className="sticky top-20 space-y-2">
                    <h3 className="px-3 text-sm font-semibold text-slate-400 uppercase tracking-wider">{t('knowledgeView.tabs.guide')}</h3>
                    <nav>
                        {groupedArticles.map(([groupKey, groupData]) => {
                            const { icon, color } = getGroupInfo(groupKey);
                            const isActive = activeSection === groupKey;
                            return (
                                <button
                                    key={groupKey}
                                    onClick={() => scrollToSection(groupKey)}
                                    className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? `bg-slate-800 ${color}` : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}`}
                                >
                                    <div className="w-5 h-5">{icon}</div>
                                    <span>{groupData.name}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            <main className="md:col-span-8 lg:col-span-9 space-y-12">
                {groupedArticles.map(([groupKey, groupData]) => {
                    const { icon, color, accentColor } = getGroupInfo(groupKey);
                    return (
                        // FIX: Changed ref callback to an expression that returns void to match expected type.
                        <section key={groupKey} id={groupKey} ref={el => { sectionRefs.current[groupKey] = el }} className="scroll-mt-20">
                            <h2 className={`text-2xl font-bold font-display flex items-center gap-3 mb-4 ${color} border-b ${accentColor} pb-2`}>
                                {icon} {groupData.name}
                            </h2>
                            <div className="space-y-3">
                                {groupData.articles.map((article, index) => (
                                    <details key={article.id} className="group bg-slate-800/50 rounded-lg overflow-hidden ring-1 ring-inset ring-white/20" open={index === 0}>
                                        <summary className={`list-none flex justify-between items-center p-4 cursor-pointer border-l-4 ${accentColor}`}>
                                            <h4 className="font-semibold text-slate-100">{t(article.titleKey)}</h4>
                                            <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                                        </summary>
                                        <Speakable elementId={`guide-${article.id}`}>
                                            <div className="p-4 border-t border-slate-700/50">
                                                <div className="prose prose-sm dark:prose-invert max-w-none prose-h3:text-primary-400 prose-strong:text-slate-100 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1" dangerouslySetInnerHTML={{ __html: t(article.contentKey) }} />
                                            </div>
                                        </Speakable>
                                    </details>
                                ))}
                            </div>
                        </section>
                    )
                })}
            </main>
        </div>
    );
};
export default GuideViewComponent;