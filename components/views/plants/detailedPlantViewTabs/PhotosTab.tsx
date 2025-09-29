import React, { useState, useEffect, useMemo } from 'react';
import { JournalEntry, PhotoDetails } from '@/types';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { dbService } from '@/services/dbService';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';

interface PhotoTabProps {
    journal: JournalEntry[];
}

const PhotoItem: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
    // FIX: Cast details to PhotoDetails to access imageId and imageUrl
    const [imageUrl, setImageUrl] = useState<string | null>((entry.details as PhotoDetails)?.imageUrl || null);
    // FIX: Cast details to PhotoDetails to access imageId and imageUrl
    const [isLoading, setIsLoading] = useState(!((entry.details as PhotoDetails)?.imageUrl));

    useEffect(() => {
        let isMounted = true;
        // FIX: Cast details to PhotoDetails to access imageId and imageUrl
        const details = entry.details as PhotoDetails;
        if (details?.imageId && !imageUrl) {
            setIsLoading(true);
            // FIX: Cast details to PhotoDetails to access imageId and imageUrl
            dbService.getImage(details.imageId)
                .then(storedImage => {
                    if (isMounted && storedImage) setImageUrl(storedImage.data);
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
                <p className="text-white/70 text-xs">{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
        </div>
    );
};


export const PhotosTab: React.FC<PhotoTabProps> = ({ journal }) => {
    const { t } = useTranslation();
    
    const photoJournalEntries = useMemo(() => 
        // FIX: Cast details to PhotoDetails to access imageId and imageUrl
        journal.filter(entry => entry.type === 'PHOTO' && ((entry.details as PhotoDetails)?.imageUrl || (entry.details as PhotoDetails)?.imageId)), 
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