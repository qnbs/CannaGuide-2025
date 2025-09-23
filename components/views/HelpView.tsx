import React from 'react';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <details className="group border-b border-slate-700/50 pb-3 last:border-b-0 last:pb-0">
    <summary className="list-none flex justify-between items-center cursor-pointer py-3">
      <h4 className="font-semibold text-slate-100">{question}</h4>
      <PhosphorIcons.ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <p className="text-sm text-slate-300 pt-2 pl-4">{answer}</p>
  </details>
);

const FAQSection: React.FC<{ title: string; faqs: { q: string; a: string }[] }> = ({ title, faqs }) => (
  <Card>
    <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{title}</h3>
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <FAQItem key={index} question={faq.q} answer={faq.a} />
      ))}
    </div>
  </Card>
);

export const HelpView: React.FC = () => {
  const { t } = useTranslations();

  // The translation file returns an object of sections, so we can map over it.
  const sections = t('helpView.sections') || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold font-display text-slate-100">{t('helpView.title')}</h2>
        <p className="text-slate-400 mt-1">{t('helpView.subtitle')}</p>
      </div>
      
      {Object.entries(sections).map(([key, sectionData]: [string, any]) => (
        <FAQSection key={key} title={sectionData.title} faqs={sectionData.faqs} />
      ))}
    </div>
  );
};
