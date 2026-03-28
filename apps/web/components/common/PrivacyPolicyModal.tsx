import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface PrivacyPolicyModalProps {
    isOpen: boolean
    onClose: () => void
}

const SECTIONS = [
    'overview',
    'dataStorage',
    'aiServices',
    'imageProcessing',
    'cookies',
    'thirdParty',
    'rights',
    'contact',
] as const

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation()

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('legal.privacyPolicy.title')}
            description={t('legal.privacyPolicy.lastUpdated', { date: '2025-01-01' })}
            size="2xl"
            bodyClassName="pb-4"
        >
            <div className="space-y-6 p-1 sm:p-2">
                {SECTIONS.map((sectionKey) => (
                    <section key={sectionKey} className="space-y-2">
                        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                            <PhosphorIcons.ShieldCheck className="w-4 h-4 text-primary-400 shrink-0" />
                            {t(`legal.privacyPolicy.sections.${sectionKey}.title`)}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {t(`legal.privacyPolicy.sections.${sectionKey}.content`)}
                        </p>
                    </section>
                ))}

                {/* Impressum */}
                <section className="space-y-2 pt-4 border-t border-slate-700">
                    <h3 className="text-base font-semibold text-slate-100">
                        {t('legal.impressum.title')}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        {t('legal.impressum.content')}
                    </p>
                </section>
            </div>
        </Modal>
    )
}
