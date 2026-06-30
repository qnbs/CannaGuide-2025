import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { Modal } from '@/components/common/Modal'
import { StrainCompactItem } from '../StrainCompactItem'

interface DescendantsModalProps {
    descendants: { children: Strain[]; grandchildren: Strain[] }
    name: string
    onClose: () => void
    onDescendantClick: (strain: Strain) => void
}

export const DescendantsModal: React.FC<DescendantsModalProps> = ({
    descendants,
    name,
    onClose,
    onDescendantClick,
}) => {
    const { t } = useTranslation()

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={`${t('strainsView.genealogyView.knownDescendants', { name })}`}
            size="lg"
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {(descendants?.children?.length ?? 0) > 0 && (
                    <div key="children-section">
                        <h3 className="font-bold text-lg text-primary-300 mb-2">
                            {t('strainsView.genealogyView.children')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {descendants?.children
                                ?.filter((strain): strain is Strain => !!strain)
                                .map((strain) => (
                                    <StrainCompactItem
                                        key={`child-${strain.id}`}
                                        strain={strain}
                                        onClick={() => onDescendantClick(strain)}
                                    />
                                ))}
                        </div>
                    </div>
                )}
                {(descendants?.grandchildren?.length ?? 0) > 0 && (
                    <div key="grandchildren-section">
                        <h3 className="font-bold text-lg text-primary-300 mb-2 mt-4">
                            {t('strainsView.genealogyView.grandchildren')}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {descendants?.grandchildren
                                ?.filter((strain): strain is Strain => !!strain)
                                .map((strain) => (
                                    <StrainCompactItem
                                        key={`grandchild-${strain.id}`}
                                        strain={strain}
                                        onClick={() => onDescendantClick(strain)}
                                    />
                                ))}
                        </div>
                    </div>
                )}
                {(descendants?.children?.length ?? 0) === 0 &&
                    (descendants?.grandchildren?.length ?? 0) === 0 && (
                        <p key="no-descendants" className="text-slate-400 text-center py-8">
                            {t('strainsView.genealogyView.noDescendantsFound')}
                        </p>
                    )}
            </div>
        </Modal>
    )
}
