import React, { useState, useMemo } from 'react';
import { Strain } from '@/types';
import { useAppSelector } from '@/stores/store';
import { selectSavedStrainTips } from '@/stores/selectors';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface StrainImageGalleryTabProps {
    strain: Strain;
}

export const StrainImageGalleryTab: React.FC<StrainImageGalleryTabProps> = ({ strain }) => {
    const { t } = useTranslation();
    const savedTips = useAppSelector(selectSavedStrainTips);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const images = useMemo(() => savedTips
        .filter(tip => tip.strainId === strain.id && tip.imageUrl)
        .map(tip => ({ url: tip.imageUrl!, createdAt: tip.createdAt, title: tip.title }))
        .sort((a, b) => b.createdAt - a.createdAt), 
    [savedTips, strain.id]);

    if (images.length === 0) {
        return (
            <Card className="text-center py-10 text-slate-500">
                <PhosphorIcons.Camera className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="font-semibold">{t('strainsView.strainDetail.images.noImagesTitle')}</h3>
                <p className="text-sm">{t('strainsView.strainDetail.images.noImagesSubtitle')}</p>
            </Card>
        );
    }

    return (
        <>
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <img src={selectedImage} alt="Full screen strain" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <Card key={index} className="p-0 overflow-hidden cursor-pointer group" onClick={() => setSelectedImage(image.url)}>
                        <div className="relative">
                            <img src={image.url} alt={image.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                             <div className="absolute bottom-0 left-0 p-2 text-xs text-white">
                                <p className="font-semibold truncate">{image.title}</p>
                                <p className="text-white/70">{new Date(image.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
};
