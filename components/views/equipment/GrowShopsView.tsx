import React, { useState, useMemo, memo } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Button } from '@/components/common/Button';
import { PaymentIcons } from '@/components/icons/PaymentIcons';
import { Modal } from '@/components/common/Modal';

type ShopRegion = 'europe' | 'us';

const ShopDetailModal: React.FC<{ shop: any; t: (key: string, params?: any) => any; onClose: () => void }> = memo(({ shop, t, onClose }) => (
    <Modal isOpen={true} onClose={onClose} title={shop.name} size="lg">
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm text-slate-400">{shop.location}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <PhosphorIcons.Star key={i} weight={i < Math.round(shop.rating) ? 'fill' : 'regular'} className={`w-5 h-5 ${i < Math.round(shop.rating) ? 'text-amber-400' : 'text-slate-500'}`} />
                    ))}
                </div>
                <span className="font-bold text-amber-300">{shop.rating.toFixed(1)}</span>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                <p className="text-slate-300 text-sm">{shop.description}</p>
                <div>
                    <h4 className="font-semibold text-primary-400 mb-2">{t('equipmentView.growShops.strengths')}</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                        {shop.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-primary-400 mb-2">{t('equipmentView.growShops.shipping')}</h4>
                    <p className="text-sm text-slate-300">{shop.shipping}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-primary-400 mb-2">{t('equipmentView.growShops.paymentMethods')}</h4>
                    <div className="flex items-center gap-2">
                        {shop.paymentMethods.map((pm: string) => {
                            const Icon = PaymentIcons[pm as keyof typeof PaymentIcons];
                            return Icon ? <Icon key={pm} className="w-8 h-8 text-slate-300" /> : null;
                        })}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex-shrink-0">
                <Button as="a" href={shop.url} target="_blank" rel="noopener noreferrer" className="w-full text-center">
                    {t('equipmentView.growShops.visitShop', { shopName: shop.name })} <PhosphorIcons.ArrowSquareOut className="inline w-4 h-4 ml-1.5" />
                </Button>
            </div>
        </div>
    </Modal>
));

export const GrowShopsView: React.FC = () => {
    const { t } = useTranslation();
    const [region, setRegion] = useState<ShopRegion>('europe');
    const [selectedShopKey, setSelectedShopKey] = useState<string | null>(null);

    const allShops = useMemo(() => t('equipmentView.growShops.shops', { returnObjects: true }) as Record<string, any>, [t]);

    const filteredAndSortedShops = useMemo(() => {
        const regionKey = region === 'europe' ? 'european' : 'us';
        const shopKeys = t(`equipmentView.growShops.${regionKey}.shopKeys`, { returnObjects: true }) as string[];

        if (!Array.isArray(shopKeys)) return [];

        return shopKeys
            .map(key => ({ ...allShops[key], key }))
            .sort((a, b) => b.rating - a.rating);
    }, [allShops, region, t]);

    const selectedShop = selectedShopKey ? allShops[selectedShopKey] : null;

    return (
        <div>
            {selectedShop && <ShopDetailModal shop={selectedShop} t={t} onClose={() => setSelectedShopKey(null)} />}
            
            <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 mb-4">
                <button onClick={() => setRegion('europe')} className={`flex-1 px-2 py-1 text-sm font-semibold rounded-md transition-colors ${region === 'europe' ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-700/50'}`}>{t('equipmentView.growShops.region.europe')}</button>
                <button onClick={() => setRegion('us')} className={`flex-1 px-2 py-1 text-sm font-semibold rounded-md transition-colors ${region === 'us' ? 'bg-slate-700 text-primary-300' : 'text-slate-300 hover:bg-slate-700/50'}`}>{t('equipmentView.growShops.region.usa')}</button>
            </div>
            
            <div className="space-y-3">
                {filteredAndSortedShops.map(shop => (
                    <Card key={shop.key} onClick={() => setSelectedShopKey(shop.key)} className="p-3 cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-100">{shop.name}</h4>
                                <p className="text-xs text-slate-400">{shop.location}</p>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-bold text-amber-400">
                                <PhosphorIcons.Star weight="fill" />
                                <span>{shop.rating.toFixed(1)}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};