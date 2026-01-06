import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question5Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: '12-moins', label: '12 ans ou moins' },
    { id: '13-16', label: '13–16 ans' },
    { id: '17-24', label: '17–24 ans' },
    { id: '25-plus', label: '25 ans ou plus' },
  ];

  return (
    <QuestionTemplate
      currentStep={5}
      totalSteps={7}
      question="À quel âge avez-vous découvert du contenu explicite pour la première fois ?"
      questionKey="firstExposure"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-6"
    />
  );
}