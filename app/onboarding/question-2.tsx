import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question2Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'plus-fois-jour', label: 'Plus d\'une fois par jour' },
    { id: 'fois-jour', label: 'Une fois par jour' },
    { id: 'fois-semaine', label: 'Quelques fois par semaine' },
    { id: 'moins-semaine', label: 'Moins d\'une fois par semaine' },
  ];

  return (
    <QuestionTemplate
      currentStep={2}
      totalSteps={7}
      question="À quelle fréquence regardez-vous habituellement de la pornographie ?"
      questionKey="frequency"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-3"
    />
  );
}