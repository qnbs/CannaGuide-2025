import React, { useState, useMemo, memo } from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
// FIX: The PhosphorIcons import was incorrect. Correcting it to use the proper export structure.
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

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h5 className="font-bold text-primary-300 mb-2">{title}</h5>
        <div className="text-sm text-slate-300 space-y-2 prose prose-sm dark:prose-invert max-w-none">{children}</div>
    </div>
);

// FIX: Added isOpen to the component's props interface to match its usage.
const SeedbankProfile: React.FC<{ bankKey: string; isOpen?: boolean }> = ({ bankKey, isOpen }) => {
    const { t } = useTranslation();
    const bank = t(`equipmentView.seedbanks.${bankKey}`, { returnObjects: true }) as any;

    if (!bank || !bank.title) return null;

    return (
        <details className="group glass-pane rounded-lg overflow-hidden" open={isOpen}>
            <summary className="list-none flex justify-between items-center p-4 cursor-pointer">
                <h4 className="font-semibold text-slate-100 flex items-center gap-3">
                    {bank.title}
                </h4>
                <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="p-4 border-t border-slate-700/50 space-y-4">
                {bank.profile && <Section title={bank.profile.title}><p>{bank.profile.content}</p></Section>}
                
                {bank.availability && (
                    <Section title={bank.availability.title}>
                        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 list-none p-0 m-0">
                            {bank.availability.strains?.map((s: string) => <li key={s} className="flex items-center gap-2"><PhosphorIcons.Leafy className="w-4 h-4 text-primary-400" />{s}</li>)}
                        </ul>
                    </Section>
                )}

                {bank.policies && (
                    <Section title={bank.policies.title}>
                        <div className="space-y-3">
                            {bank.policies.payment && (
                                <div>
                                    <h6 className="font-semibold text-slate-200">{bank.policies.payment.title}</h6>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {bank.policies.payment.methods?.map((m: string, i: number) => <li key={i}>{m}</li>)}
                                    </ul>
                                </div>
                            )}
                             {bank.policies.shipping && (
                                <div>
                                    <h6 className="font-semibold text-slate-200">{bank.policies.shipping.title}</h6>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {bank.policies.shipping.points?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Section>
                )}

                {bank.service && (
                    <Section title={bank.service.title}>
                        <ul className="list-none p-0 m-0 space-y-1">
                            {bank.service.phone && <li>{bank.service.phone}</li>}
                            {bank.service.digital && <li>{bank.service.digital}</li>}
                            {bank.service.address && <li>{bank.service.address}</li>}
                            {bank.service.email && <li>{bank.service.email}</li>}
                        </ul>
                    </Section>
                )}

                {bank.offers && (
                     <Section title={bank.offers.title}>
                         <ul className="list-disc pl-5 space-y-1">
                            {bank.offers.points?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                         </ul>
                         {bank.offers.conclusion && <p className="mt-2">{bank.offers.conclusion}</p>}
                     </Section>
                )}

                {bank.assessment && <Section title={bank.assessment.title}><p>{bank.assessment.content}</p></Section>}
            </div>
        </details>
    );
};

const SeedbanksView: React.FC = () => {
    const { t } = useTranslation();
    const allBanksData = t('equipmentView.seedbanks', { returnObjects: true }) as any;
    const bankKeys = Object.keys(allBanksData).filter(key => key !== 'conclusions' && typeof allBanksData[key] === 'object');
    const conclusions = allBanksData.conclusions;

    return (
        <div className="space-y-3">
            {bankKeys.map((key, index) => (
                <SeedbankProfile key={key} bankKey={key} isOpen={index === 0} />
            ))}
            {conclusions && (
                 <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{conclusions.title}</h3>
                    <div className="space-y-4 text-sm text-slate-300">
                        <p>{conclusions.content}</p>
                        {conclusions.categories && Object.values(conclusions.categories).map((cat: any, i: number) => (
                             <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                                 <h4 className="font-bold text-slate-100">{cat.title}</h4>
                                 <p className="mt-1">{cat.content}</p>
                             </div>
                        ))}
                         <p>{conclusions.summary}</p>
                    </div>
                 </Card>
            )}
        </div>
    );
};

export default SeedbanksView;