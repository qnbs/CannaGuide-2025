import React, { useState, useRef, useEffect } from 'react';
import { Plant, MentorMessage } from '@/types';
import { Button } from '@/components/common/Button';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { startPlantMentorChat, clearMentorChat } from '@/stores/slices/aiSlice';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { Input } from '@/components/ui/ThemePrimitives';

interface MentorChatViewProps {
    plant: Plant;
    onClose: () => void;
}

const Message: React.FC<{ message: MentorMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0"><PhosphorIcons.Brain className="w-5 h-5 text-primary-300"/></div>}
            <div className={`max-w-md p-3 rounded-lg ${isUser ? 'bg-slate-700 text-slate-100' : 'bg-slate-800'}`}>
                {message.title && <h4 className="font-bold text-primary-300">{message.title}</h4>}
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: message.content }} />
            </div>
        </div>
    );
};


export const MentorChatView: React.FC<MentorChatViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const chatState = useAppSelector(state => state.ai.mentorChats[plant.id] || { history: [], isLoading: false, error: null });
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [chatState.history]);

    const handleSend = () => {
        if (input.trim()) {
            dispatch(startPlantMentorChat({ plant, query: input.trim() }));
            setInput('');
        }
    };

    const handleClear = () => {
        if(window.confirm(t('knowledgeView.aiMentor.clearConfirm'))) {
            dispatch(clearMentorChat(plant.id));
        }
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <header className="flex-shrink-0 mb-4">
                 <div className="flex items-center justify-between">
                    <Button variant="secondary" onClick={onClose}>
                        <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                        {t('common.back')}
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleClear} disabled={chatState.history.length === 0}>
                        <PhosphorIcons.TrashSimple className="w-4 h-4 mr-1"/>
                        {t('knowledgeView.aiMentor.clearChat')}
                    </Button>
                </div>
                <div className="mt-4">
                    <h1 className="text-3xl font-bold font-display text-primary-300">{t('knowledgeView.aiMentor.title')}</h1>
                    <p className="text-slate-400">{t('knowledgeView.aiMentor.plantContext', { name: plant.name })}</p>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                {chatState.history.map((msg, index) => (
                    <Message key={index} message={msg} />
                ))}
                {chatState.isLoading && <AiLoadingIndicator loadingMessage={t('ai.generating')} />}
                 <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 mt-4">
                <div className="relative">
                    <Input
                        as="textarea"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={t('knowledgeView.aiMentor.inputPlaceholder')}
                        className="pr-20 resize-none"
                        rows={2}
                    />
                    <Button onClick={handleSend} disabled={chatState.isLoading || !input.trim()} className="absolute right-2 bottom-2 !p-2">
                        <PhosphorIcons.PaperPlaneTilt className="w-5 h-5"/>
                    </Button>
                </div>
            </div>
        </div>
    );
};