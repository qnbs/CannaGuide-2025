import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { CannabisLeafIcon } from '@/components/icons/CannabisLeafIcon'
import { SafeHtml } from '@/components/common/SafeHtml'

const InfoSection: React.FC<{
    title: string
    icon?: React.ReactNode
    children: React.ReactNode
    id?: string
}> = ({ title, icon, children, id }) => (
    <div id={id}>
        <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2 border-b border-slate-700/50 pb-2">
            {icon}
            {title}
        </h3>
        <div className="space-y-3 text-sm text-slate-300 prose prose-sm dark:prose-invert max-w-none prose-h4:text-primary-300 prose-strong:text-slate-100 prose-ul:list-disc prose-li:my-1 prose-code:bg-slate-800 prose-code:p-1 prose-code:rounded prose-code:font-mono prose-code:text-accent-300 prose-a:text-primary-400 hover:prose-a:underline">
            {children}
        </div>
    </div>
)

const ListItem: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
    icon,
    children,
}) => (
    <div className="flex items-start gap-3">
        <div className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5">{icon}</div>
        <div>{children}</div>
    </div>
)

const AboutAppContent = memo(() => {
    const { t } = useTranslation()
    const whatsNewItems = t('settingsView.about.whatsNew.items', { returnObjects: true }) as Record<
        string,
        string
    >

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <div className="text-center">
                    <CannabisLeafIcon className="w-20 h-20 mx-auto" />
                    <h2 className="text-3xl font-bold font-display mt-2">CannaGuide 2025</h2>
                    <p className="text-slate-400 font-semibold">
                        {t('settingsView.about.version')} {__APP_VERSION__}
                    </p>
                    <p className="text-sm text-slate-300 max-w-xl mx-auto mt-2">
                        {t('common.appShortDescription')}
                    </p>
                </div>
            </Card>

            <Card>
                <InfoSection
                    title={t('settingsView.about.whatsNew.title')}
                    icon={<PhosphorIcons.Sparkle />}
                >
                    <ul className="space-y-3">
                        {Object.entries(whatsNewItems ?? {}).map(([key, value]) => {
                            const [title, ...descriptionParts] = String(value).split(':')
                            const description = descriptionParts.join(':').trim()
                            return (
                                <ListItem
                                    key={key}
                                    icon={<PhosphorIcons.CheckCircle weight="fill" />}
                                >
                                    <span className="font-semibold text-slate-100">{title}:</span>{' '}
                                    {description}
                                </ListItem>
                            )
                        })}
                    </ul>
                </InfoSection>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <InfoSection
                        title={t('settingsView.about.techStack.title')}
                        icon={<PhosphorIcons.BracketsCurly />}
                    >
                        <ul className="space-y-2">
                            <ListItem icon={<PhosphorIcons.Lightning />}>
                                <strong>Google Gemini:</strong>{' '}
                                {t('settingsView.about.techStack.gemini')}
                            </ListItem>
                            <ListItem icon={<PhosphorIcons.Cube />}>
                                <strong>React 19 & Redux:</strong>{' '}
                                {t('settingsView.about.techStack.react')}
                            </ListItem>
                            <ListItem icon={<PhosphorIcons.Archive />}>
                                <strong>IndexedDB:</strong>{' '}
                                {t('settingsView.about.techStack.indexedDb')}
                            </ListItem>
                            <ListItem icon={<PhosphorIcons.GearSix />}>
                                <strong>Web Workers:</strong>{' '}
                                {t('settingsView.about.techStack.webWorkers')}
                            </ListItem>
                        </ul>
                    </InfoSection>
                </Card>
                <Card>
                    <InfoSection
                        title={t('settingsView.about.credits.title')}
                        icon={<PhosphorIcons.BookOpenText />}
                    >
                        <ul className="space-y-3">
                            <ListItem icon={<PhosphorIcons.MagicWand />}>
                                <strong>Phosphor Icons:</strong>{' '}
                                {t('settingsView.about.credits.phosphor')}
                            </ListItem>
                            <ListItem icon={<PhosphorIcons.CommandLine />}>
                                <Button asChild variant="secondary" size="sm">
                                    <a
                                        href="https://github.com/qnbs/CannaGuide-2025"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center"
                                    >
                                        {t('settingsView.about.githubLinkText')}{' '}
                                        <PhosphorIcons.ArrowSquareOut className="w-4 h-4 ml-1.5" />
                                    </a>
                                </Button>
                            </ListItem>
                            <ListItem icon={<PhosphorIcons.Globe />}>
                                <Button asChild variant="secondary" size="sm">
                                    <a
                                        href="https://ai.studio/apps/drive/1_F6ArMCdXQt-1fWzTf0R6Sgge9lXxz4-"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center"
                                    >
                                        {t('settingsView.about.aiStudioLinkText')}{' '}
                                        <PhosphorIcons.ArrowSquareOut className="w-4 h-4 ml-1.5" />
                                    </a>
                                </Button>
                            </ListItem>
                        </ul>
                    </InfoSection>
                </Card>
            </div>

            <Card>
                <InfoSection
                    title={t('settingsView.about.devJourney.title')}
                    icon={<PhosphorIcons.Sparkle />}
                >
                    <p className="text-sm text-slate-400 mb-4">
                        {t('settingsView.about.devJourney.subtitle')}
                    </p>
                    <ul className="space-y-3">
                        <ListItem icon={<PhosphorIcons.LightbulbFilament />}>
                            <span className="font-semibold text-slate-100">
                                {t('settingsView.about.devJourney.phase1Title')}:
                            </span>{' '}
                            {t('settingsView.about.devJourney.phase1Desc')}
                        </ListItem>
                        <ListItem icon={<PhosphorIcons.MagnifyingGlass />}>
                            <span className="font-semibold text-slate-100">
                                {t('settingsView.about.devJourney.phase2Title')}:
                            </span>{' '}
                            {t('settingsView.about.devJourney.phase2Desc')}
                        </ListItem>
                        <ListItem icon={<PhosphorIcons.BracketsCurly />}>
                            <span className="font-semibold text-slate-100">
                                {t('settingsView.about.devJourney.phase3Title')}:
                            </span>{' '}
                            {t('settingsView.about.devJourney.phase3Desc')}
                        </ListItem>
                        <ListItem icon={<PhosphorIcons.CloudArrowUp />}>
                            <span className="font-semibold text-slate-100">
                                {t('settingsView.about.devJourney.phase4Title')}:
                            </span>{' '}
                            {t('settingsView.about.devJourney.phase4Desc')}
                        </ListItem>
                    </ul>
                    <p className="text-xs text-slate-500 mt-3 italic">
                        {t('settingsView.about.devJourney.secondaryNote')}
                    </p>
                </InfoSection>
            </Card>

            <Card>
                <InfoSection
                    title={t('settingsView.about.disclaimer.title')}
                    icon={<PhosphorIcons.WarningCircle />}
                >
                    <p className="text-sm text-slate-400 italic">
                        {t('settingsView.about.disclaimer.content')}
                    </p>
                </InfoSection>
            </Card>
        </div>
    )
})

const ReadmeProjectContent = memo(() => {
    const { t } = useTranslation()
    const readmeContent = t('settingsView.about.readmeContent', { returnObjects: true }) as Record<
        string,
        string
    >

    return (
        <Card className="animate-fade-in">
            <div className="space-y-8">
                <SafeHtml html={readmeContent.header ?? ''} />
                <InfoSection
                    title={readmeContent.philosophyTitle ?? ''}
                    icon={<PhosphorIcons.Sparkle />}
                    id="philosophy"
                >
                    <SafeHtml html={readmeContent.philosophyContent ?? ''} />
                </InfoSection>
                <InfoSection
                    title={readmeContent.featuresTitle ?? ''}
                    icon={<PhosphorIcons.ListChecks />}
                    id="features"
                >
                    <SafeHtml html={readmeContent.featuresContent ?? ''} />
                </InfoSection>
                <InfoSection
                    title={readmeContent.techTitle ?? ''}
                    icon={<PhosphorIcons.BracketsCurly />}
                    id="tech"
                >
                    <SafeHtml html={readmeContent.techContent ?? ''} />
                </InfoSection>
                <InfoSection
                    title={readmeContent.devTitle ?? ''}
                    icon={<PhosphorIcons.BracketsCurly />}
                    id="dev"
                >
                    <SafeHtml html={readmeContent.devContent ?? ''} />
                </InfoSection>
                <InfoSection
                    title={readmeContent.troubleshootingTitle ?? ''}
                    icon={<PhosphorIcons.Wrench />}
                    id="troubleshooting"
                >
                    <SafeHtml html={readmeContent.troubleshootingContent ?? ''} />
                </InfoSection>
                <InfoSection
                    title={readmeContent.aiStudioTitle ?? ''}
                    icon={<PhosphorIcons.Brain />}
                    id="aistudio"
                >
                    <SafeHtml html={readmeContent.aiStudioContent ?? ''} />
                </InfoSection>
                <InfoSection
                    title={readmeContent.contributingTitle ?? ''}
                    icon={<PhosphorIcons.Heart />}
                    id="contributing"
                >
                    <SafeHtml html={readmeContent.contributingContent ?? ''} />
                </InfoSection>
                <InfoSection
                    title={readmeContent.disclaimerTitle ?? ''}
                    icon={<PhosphorIcons.WarningCircle />}
                    id="disclaimer"
                >
                    <SafeHtml html={readmeContent.disclaimerContent ?? ''} />
                </InfoSection>
            </div>
        </Card>
    )
})

const AboutTab: React.FC = () => {
    const { t } = useTranslation()
    const [activeSubTab, setActiveSubTab] = useState('about')
    const subTabBaseClass = 'flex-1 px-2 py-1 text-sm font-semibold rounded-md transition-colors'
    const activeSubTabClass = 'bg-slate-700 text-primary-300'
    const inactiveSubTabClass = 'text-slate-300 hover:bg-slate-700/50'
    const aboutTabClass = `${subTabBaseClass} ${
        activeSubTab === 'about' ? activeSubTabClass : inactiveSubTabClass
    }`
    const projectInfoTabClass = `${subTabBaseClass} ${
        activeSubTab === 'readme' ? activeSubTabClass : inactiveSubTabClass
    }`
    const activeSubTabContent =
        activeSubTab === 'about' ? <AboutAppContent /> : <ReadmeProjectContent />

    return (
        <div className="space-y-6">
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
                <button onClick={() => setActiveSubTab('about')} className={aboutTabClass}>
                    {t('settingsView.about.title')}
                </button>
                <button onClick={() => setActiveSubTab('readme')} className={projectInfoTabClass}>
                    {t('settingsView.about.projectInfo')}
                </button>
            </div>

            {activeSubTabContent}
        </div>
    )
}

AboutAppContent.displayName = 'AboutAppContent'
ReadmeProjectContent.displayName = 'ReadmeProjectContent'

const AboutTabMemo = memo(AboutTab)
AboutTabMemo.displayName = 'AboutTab'
export default AboutTabMemo
