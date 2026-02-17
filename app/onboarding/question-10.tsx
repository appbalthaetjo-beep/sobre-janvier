import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question10Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'oui', label: 'Oui' },
    { id: 'non', label: 'Non' },
  ];

  return (
    <QuestionTemplate
      currentStep={10}
      totalSteps={13}
      question="Avez-vous déjà dépensé de l'argent pour accéder à du contenu explicite ?"
      questionKey="money"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-11"
    />
  );
}
