
import React, { useState, useEffect, useMemo } from 'react';
import { JournalEntry } from '../../../../types';
import { Card } from '../../../common/Card';
import { useTranslations } from '../../../../hooks/useTranslations';
import { dbService } from '../../../../services/dbService';
import { SkeletonLoader } from '../../../common/SkeletonLoader';

interface PhotoTabProps {
    journal: JournalEntry[];
}

const PhotoItem: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(entry.details?.imageUrl || null);
    const [isLoading, setIsLoading] = useState(!entry.details?.imageUrl);

    useEffect(() => {
        let isMounted = true;
        if (entry.details?.imageId && !imageUrl) {
            setIsLoading(true);
            dbService.getImage(entry.details.imageId)
                .then(data => {
                    if (isMounted && data) setImageUrl(data);
                })
                .catch(console.error)
                .finally(() => {
                    if (isMounted) setIsLoading(false)
                });
        } else if (imageUrl) {
            setIsLoading(false);
        }
        return () => { isMounted = false; }
    }, [entry.details, imageUrl]);

    if (isLoading) {
        return <SkeletonLoader className="w-full h-48 rounded-lg" />;
    }

    if (!imageUrl) return null;

    return (
        <div className="group relative">
            <img src={imageUrl} alt={entry.notes} className="w-full h-48 object-cover rounded-lg" loading="lazy" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end rounded-lg">
                <p className="text-white text-sm font-semibold">{entry.notes}</p>
                <p className="text-white/70 text-xs">{new Date(entry.timestamp).toLocaleString()}</p>
            </div>
        </div>
    );
};


export const PhotosTab: React.FC<PhotoTabProps> = ({ journal }) => {
    const { t } = useTranslations();
    
    const photoJournalEntries = useMemo(() => 
        journal.filter(entry => entry.type === 'PHOTO' && (entry.details?.imageUrl || entry.details?.imageId)), 
    [journal]);

    return (
        <Card>
            {photoJournalEntries.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...photoJournalEntries].reverse().map(entry => (
                        <PhotoItem key={entry.id} entry={entry} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-slate-400 py-8">{t('plantsView.detailedView.photosNoEntries')}</p>
            )}
        </Card>
    );
};
