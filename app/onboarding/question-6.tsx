import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question6Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'frequemment', label: 'Fréquemment' },
    { id: 'occasionnellement', label: 'Occasionnellement' },
    { id: 'rarement', label: 'Rarement ou jamais' },
  ];

  return (
    <QuestionTemplate
      currentStep={6}
      totalSteps={7}
      question="Trouvez-vous difficile d'atteindre l'excitation sexuelle sans pornographie ou fantasmes ?"
      questionKey="arousal"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-7"
    />
  );
}