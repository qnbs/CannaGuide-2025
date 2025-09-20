import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { useTranslations } from '../../hooks/useTranslations';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface EditableResponse {
    id: string;
    title: string;
    content: string;
}

interface EditResponseModalProps<T extends EditableResponse> {
    response: T;
    onClose: () => void;
    onSave: (updatedResponse: T) => void;
}

export const EditResponseModal = <T extends EditableResponse>({ response, onClose, onSave }: EditResponseModalProps<T>) => {
    const { t } = useTranslations();
    const [title, setTitle] = useState(response.title);
    const [content, setContent] = useState(response.content);
    const modalRef = useFocusTrap(true);

    const handleSave = () => {
        onSave({ ...response, title, content });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card ref={modalRef} className="w-full max-w-lg modal-content-animate" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-primary-400 mb-4">{t('knowledgeView.archive.editTitle')}</h2>
                <div className="space-y-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2" />
                    <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
                    <Button onClick={handleSave}>{t('common.save')}</Button>
                </div>
            </Card>
        </div>
    );
};