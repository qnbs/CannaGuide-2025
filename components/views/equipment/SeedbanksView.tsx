import React from 'react';
import { Card } from '@/components/common/Card';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface BankSection {
    title: string;
    content?: string;
    strains?: string[];
    points?: string[];
    conclusion?: string;
    methods?: string[];
    // service contact fields
    phone?: string;
    digital?: string;
    address?: string;
    email?: string;
    // nested sub-sections
    payment?: { title: string; methods?: string[] };
    shipping?: { title: string; points?: string[] };
}

interface BankData {
    title?: string;
    profile?: BankSection;
    availability?: BankSection;
    policies?: BankSection;
    service?: BankSection;
    offers?: BankSection;
    assessment?: BankSection;
}

type ConclusionsCategory = { title: string; content: string };

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h5 className="font-bold text-primary-300 mb-2">{title}</h5>
        <div className="text-sm text-slate-300 space-y-2 prose prose-sm dark:prose-invert max-w-none">{children}</div>
    </div>
);

const stripNumericPrefix = (value: string): string => value.replace(/^\d+\.\s*/, '')

const SeedbankProfile: React.FC<{ bankKey: string; displayIndex: number; isOpen?: boolean }> = ({ bankKey, displayIndex, isOpen }) => {
    const { t } = useTranslation();
    const bank = t(`equipmentView.seedbanks.${bankKey}`, { returnObjects: true }) as BankData;

    if (!bank || !bank.title) return null;

    return (
        <details className="group glass-pane rounded-lg overflow-hidden" open={isOpen}>
            <summary className="list-none flex justify-between items-center p-4 cursor-pointer">
                <h4 className="font-semibold text-slate-100 flex items-center gap-3">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-primary-400/30 bg-primary-500/10 px-2 text-xs font-bold text-primary-300">
                        {displayIndex}
                    </span>
                    <span>{stripNumericPrefix(bank.title)}</span>
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
    const allBanksData = t('equipmentView.seedbanks', { returnObjects: true }) as Record<string, BankData & { categories?: Record<string, ConclusionsCategory>; content?: string; summary?: string }>;
    const bankKeys = Object.entries(allBanksData)
        .filter(([key, value]) => key !== 'conclusions' && typeof value === 'object')
        .sort(([, leftValue], [, rightValue]) => {
            const leftTitle = (leftValue as BankData).title ?? ''
            const rightTitle = (rightValue as BankData).title ?? ''
            const leftNumber = Number(leftTitle.match(/^\d+/)?.[0] ?? Number.POSITIVE_INFINITY)
            const rightNumber = Number(rightTitle.match(/^\d+/)?.[0] ?? Number.POSITIVE_INFINITY)

            if (leftNumber !== rightNumber) {
                return leftNumber - rightNumber
            }

            return leftTitle.localeCompare(rightTitle)
        })
        .map(([key]) => key);
    const conclusions = allBanksData.conclusions;

    return (
        <div className="space-y-3">
            {bankKeys.map((key, index) => (
                <SeedbankProfile key={key} bankKey={key} displayIndex={index + 1} isOpen={index === 0} />
            ))}
            {conclusions && (
                 <Card>
                    <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{conclusions.title}</h3>
                    <div className="space-y-4 text-sm text-slate-300">
                        <p>{conclusions.content}</p>
                        {conclusions.categories && Object.values(conclusions.categories).map((cat: ConclusionsCategory, i: number) => (
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
