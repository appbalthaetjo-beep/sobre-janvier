import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question4Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'oui', label: 'Oui' },
    { id: 'non', label: 'Non' },
  ];

  return (
    <QuestionTemplate
      currentStep={4}
      totalSteps={7}
      question="Avez-vous remarqué une évolution vers du contenu plus extrême ou graphique ?"
      questionKey="escalation"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-5"
    />
  );
}