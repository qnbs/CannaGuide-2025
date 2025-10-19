import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { CannabisLeafIcon } from '@/components/icons/CannabisLeafIcon';
import { APP_VERSION, APP_METADATA } from '@/constants';

const InfoSection: React.FC<{ title: string, icon?: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2">
            {icon}
            {title}
        </h3>
        <div className="space-y-3 text-sm text-slate-300">{children}</div>
    </div>
);

const ListItem: React.FC<{ icon: React.ReactNode, children: React.ReactNode }> = ({ icon, children }) => (
    <div className="flex items-start gap-3">
        <div className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5">{icon}</div>
        <div>{children}</div>
    </div>
);


const AboutTab: React.FC = () => {
    const { t } = useTranslation();

    const whatsNewItems = t('settingsView.about.whatsNew.items', { returnObjects: true }) as Record<string, string>;

    return (
        <div className="space-y-6">
            <Card>
                <div className="text-center">
                    <CannabisLeafIcon className="w-20 h-20 mx-auto" />
                    <h2 className="text-3xl font-bold font-display mt-2">CannaGuide 2025</h2>
                    <p className="text-slate-400 font-semibold">{t('settingsView.about.version')} {APP_VERSION}.0.0</p>
                    <p className="text-sm text-slate-300 max-w-xl mx-auto mt-2">{APP_METADATA.description}</p>
                </div>
            </Card>

            <Card>
                <InfoSection title={t('settingsView.about.whatsNew.title')} icon={<PhosphorIcons.Sparkle />}>
                    <ul className="space-y-3">
                        {Object.entries(whatsNewItems).map(([key, value]) => {
                            const [title, description] = value.split(':');
                            return (
                                <ListItem key={key} icon={<PhosphorIcons.CheckCircle weight="fill" />}>
                                    <span className="font-semibold text-slate-100">{title}:</span> {description}
                                </ListItem>
                            );
                        })}
                    </ul>
                </InfoSection>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <InfoSection title={t('settingsView.about.techStack.title')} icon={<PhosphorIcons.BracketsCurly />}>
                         <ul className="space-y-2">
                            <ListItem icon={<PhosphorIcons.Lightning />}><strong>Google Gemini:</strong> {t('settingsView.about.techStack.gemini')}</ListItem>
                            {/* FIX: Replaced missing PhosphorIcons.Atom with PhosphorIcons.Cube. */}
                            <ListItem icon={<PhosphorIcons.Cube />}><strong>React 19 & Redux:</strong> {t('settingsView.about.techStack.react')}</ListItem>
                            {/* FIX: Replaced missing PhosphorIcons.Database with PhosphorIcons.Archive. */}
                            <ListItem icon={<PhosphorIcons.Archive />}><strong>IndexedDB:</strong> {t('settingsView.about.techStack.indexedDb')}</ListItem>
                            <ListItem icon={<PhosphorIcons.GearSix />}><strong>Web Workers:</strong> {t('settingsView.about.techStack.webWorkers')}</ListItem>
                        </ul>
                    </InfoSection>
                </Card>
                <Card>
                    {/* FIX: Replaced missing PhosphorIcons.Users with PhosphorIcons.BookOpenText. */}
                    <InfoSection title={t('settingsView.about.credits.title')} icon={<PhosphorIcons.BookOpenText />}>
                        <ul className="space-y-3">
                            {/* FIX: Replaced missing PhosphorIcons.PaintBrush with PhosphorIcons.MagicWand. */}
                            <ListItem icon={<PhosphorIcons.MagicWand />}><strong>Phosphor Icons:</strong> {t('settingsView.about.credits.phosphor')}</ListItem>
                            {/* FIX: Replaced missing PhosphorIcons.GithubLogo with PhosphorIcons.CommandLine. */}
                            <ListItem icon={<PhosphorIcons.CommandLine />}>
                                <Button as="a" href="https://github.com/qnbs/CannaGuide-2025" target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" className="inline-flex items-center">
                                    {t('settingsView.about.githubLinkText')} <PhosphorIcons.ArrowSquareOut className="w-4 h-4 ml-1.5" />
                                </Button>
                            </ListItem>
                            {/* FIX: Replaced missing PhosphorIcons.GoogleLogo with PhosphorIcons.Globe. */}
                            <ListItem icon={<PhosphorIcons.Globe />}>
                                 <Button as="a" href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-" target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" className="inline-flex items-center">
                                    {t('settingsView.about.aiStudioLinkText')} <PhosphorIcons.ArrowSquareOut className="w-4 h-4 ml-1.5" />
                                </Button>
                            </ListItem>
                        </ul>
                    </InfoSection>
                </Card>
            </div>
            
            <Card>
                <InfoSection title={t('settingsView.about.disclaimer.title')} icon={<PhosphorIcons.WarningCircle />}>
                    <p className="text-sm text-slate-400 italic">{t('settingsView.about.disclaimer.content')}</p>
                </InfoSection>
            </Card>
        </div>
    );
};

export default AboutTab;