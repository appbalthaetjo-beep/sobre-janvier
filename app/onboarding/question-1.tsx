import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question1Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'masculin', label: 'Masculin' },
    { id: 'feminin', label: 'Féminin' },
    { id: 'non-binaire', label: 'Non-binaire' },
  ];

  return (
    <QuestionTemplate
      currentStep={1}
      totalSteps={7}
      question="Quel est votre genre ?"
      questionKey="gender"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-2"
    />
  );
}