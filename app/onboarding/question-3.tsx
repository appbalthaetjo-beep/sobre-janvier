import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question3Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'frequemment', label: 'Fréquemment' },
    { id: 'occasionnellement', label: 'Occasionnellement' },
    { id: 'rarement', label: 'Rarement ou jamais' },
  ];

  return (
    <QuestionTemplate
      currentStep={3}
      totalSteps={7}
      question="Ressentez-vous parfois un manque de contrôle sur votre consommation de pornographie ?"
      questionKey="control"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-4"
    />
  );
}