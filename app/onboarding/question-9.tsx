import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question9Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'frequemment', label: 'Fréquemment' },
    { id: 'occasionnellement', label: 'Occasionnellement' },
    { id: 'rarement', label: 'Rarement ou jamais' },
  ];

  return (
    <QuestionTemplate
      currentStep={9}
      totalSteps={10}
      question="Regardez-vous de la pornographie par ennui ?"
      questionKey="boredom"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-10"
    />
  );
}