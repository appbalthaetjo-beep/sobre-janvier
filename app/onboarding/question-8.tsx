import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question8Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'frequemment', label: 'Fréquemment' },
    { id: 'occasionnellement', label: 'Occasionnellement' },
    { id: 'rarement', label: 'Rarement ou jamais' },
  ];

  return (
    <QuestionTemplate
      currentStep={8}
      totalSteps={13}
      question="Vous tournez-vous vers la pornographie quand vous êtes stressé ?"
      questionKey="stress"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-9"
    />
  );
}
