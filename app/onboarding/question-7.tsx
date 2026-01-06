import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question7Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'frequemment', label: 'Fréquemment' },
    { id: 'occasionnellement', label: 'Occasionnellement' },
    { id: 'rarement', label: 'Rarement ou jamais' },
  ];

  return (
    <QuestionTemplate
      currentStep={7}
      totalSteps={7}
      question="Utilisez-vous la pornographie pour faire face à l'inconfort émotionnel ou à la douleur ?"
      questionKey="emotional"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-8"
    />
  );
}