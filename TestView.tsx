import React from 'react';
import { MentorArchiveTab } from '@/components/views/knowledge/MentorArchiveTab';
import { ArchivedMentorResponse } from './types';
import { Card } from '@/components/common/Card';

// Dies ist eine isolierte Testumgebung, um die Komponente MentorArchiveTab zu debuggen.

// Fest codierte Testdaten, die der erwarteten Struktur entsprechen.
const testData: ArchivedMentorResponse[] = [{
  id: '123-test-id',
  title: 'Test Titel',
  query: 'Test Anfrage',
  content: 'Dies ist ein Testinhalt, um die Rendering-Logik zu überprüfen.',
  createdAt: Date.now()
}];

export const TestView: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Isolierter Test für MentorArchiveTab</h1>
      <p className="mb-4">Wenn Sie den unten stehenden "Test Titel" sehen, funktioniert die Komponente mit korrekten Daten.</p>
      <Card>
        {/* FIX: Pass test data as a prop to the component for isolated testing. */}
        <MentorArchiveTab archivedResponses={testData} />
      </Card>
    </div>
  );
};
