import React from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch } from '@/stores/store'
import { startNewPlant } from '@/stores/slices/simulationSlice'
import { Card } from '@/components/common/Card'
import { useUIStore } from '@/stores/useUIStore'

export const GrowConfirmationModal: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const cancelNewGrow = useUIStore((s) => s.cancelNewGrow)

    const handleConfirm = () => {
        dispatch(startNewPlant())
    }

    const footer = (
        <>
            <Button variant="secondary" onClick={() => cancelNewGrow()}>
                {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirm} glow={true}>
                {t('plantsView.confirmationModal.confirmButton')}
            </Button>
        </>
    )

    return (
        <Modal
            isOpen={true}
            onClose={() => cancelNewGrow()}
            title={t('plantsView.confirmationModal.title')}
            description={t('plantsView.confirmationModal.text')}
            footer={footer}
            size="lg"
        >
            <div className="space-y-4 pb-3">
                <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(15,23,42,0.92))] text-center">
                    <PhosphorIcons.Sparkle className="w-16 h-16 text-primary-400 mx-auto" />
                    <p className="mt-4 text-slate-300">{t('plantsView.confirmationModal.text')}</p>
                </Card>
            </div>
        </Modal>
    )
}
