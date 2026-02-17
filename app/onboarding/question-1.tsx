import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question1Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'masculin', label: 'Masculin' },
    { id: 'feminin', label: 'Féminin' },
  ];

  return (
    <QuestionTemplate
      currentStep={1}
      totalSteps={7}
      helperText="Cela nous aide à adapter ton accompagnement."
      question="Quel est votre genre ?"
      questionKey="gender"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-2"
    />
  );
}
