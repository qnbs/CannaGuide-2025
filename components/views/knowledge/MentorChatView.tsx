import React, { useState, useRef, useEffect } from 'react';
import { Plant, MentorMessage } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';

interface MentorChatViewProps {
    plant: Plant;
    onClose: () => void;
}

const ChatMessage: React.FC<{ message: MentorMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex gap-3 ${isUser ? 'justify-end' : ''} animate-fade-in`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary-800 flex-shrink-0 flex items-center justify-center">
                    <PhosphorIcons.Brain className="w-5 h-5 text-primary-300" />
                </div>
            )}
            <div className={`max-w-xl p-3 rounded-lg ${isUser ? 'bg-primary-600 text-white' : 'bg-slate-700'}`}>
                {message.title && <h4 className="font-bold mb-1">{message.title}</h4>}
                {isUser ? (
                    <p>{message.content}</p>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2" dangerouslySetInnerHTML={{ __html: message.content }} />
                )}
            </div>
        </div>
    );
};

export const MentorChatView: React.FC<MentorChatViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslations();
    const chatState = useAppStore(state => state.mentorChats[plant.id] || { history: [], isLoading: false, error: null });
    const { startPlantMentorChat, clearMentorChat } = useAppStore(state => ({
        startPlantMentorChat: state.startPlantMentorChat,
        clearMentorChat: state.clearMentorChat,
    }));
    
    const [input, setInput] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [chatState.history, chatState.isLoading]);

    const handleSend = () => {
        if (input.trim()) {
            startPlantMentorChat(plant, input.trim());
            setInput('');
        }
    };
    
    const examplePrompts = [
        t('knowledgeView.aiMentor.examplePrompts.plantSpecific.q1'),
        t('knowledgeView.aiMentor.examplePrompts.plantSpecific.q2'),
        t('knowledgeView.aiMentor.examplePrompts.plantSpecific.q3')
    ];

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <header className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-700">
                <Button variant="secondary" onClick={onClose} className="!p-2">
                    <PhosphorIcons.ArrowLeft className="w-5 h-5" />
                    <span className="sr-only">{t('common.back')}</span>
                </Button>
                <div>
                    <h2 className="text-xl font-bold font-display text-primary-300">{t('knowledgeView.aiMentor.title')}</h2>
                    <p className="text-sm text-slate-400">{t('common.for')} {plant.name}</p>
                </div>
            </header>

            <div ref={chatContainerRef} className="flex-grow overflow-y-auto space-y-4 p-2 -mr-2">
                {chatState.history.length === 0 && !chatState.isLoading && (
                    <div className="text-center p-4 text-slate-400">
                        <PhosphorIcons.Sparkle className="w-10 h-10 mx-auto text-primary-500 mb-2"/>
                        <p className="font-semibold">{t('knowledgeView.aiMentor.startConversation')}</p>
                        <div className="mt-4 space-y-2">
                            {examplePrompts.map((prompt, i) => (
                                <button key={i} onClick={() => setInput(prompt)} className="text-sm bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors">
                                    "{prompt}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {chatState.history.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}
                {chatState.isLoading && (
                    <div className="flex justify-center">
                        <AiLoadingIndicator loadingMessage={t('ai.generating')} />
                    </div>
                )}
            </div>

            <footer className="mt-4 pt-4 border-t border-slate-700 flex items-start gap-2">
                 <button onClick={() => window.confirm(t('common.confirm')) && clearMentorChat(plant.id)} className="p-2.5 rounded-md hover:bg-slate-700 transition-colors text-slate-400" aria-label={t('knowledgeView.aiMentor.clearChat')}>
                    <PhosphorIcons.TrashSimple className="w-5 h-5" />
                </button>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t('knowledgeView.aiMentor.askAboutPlant', {name: plant.name})}
                    className="w-full p-2 border border-slate-600 rounded-lg bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button onClick={handleSend} disabled={chatState.isLoading || !input.trim()} className="h-full">
                    <PhosphorIcons.PaperPlaneTilt className="w-5 h-5"/>
                    <span className="sr-only">{t('common.add')}</span>
                </Button>
            </footer>
        </div>
    );
};