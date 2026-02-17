import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question11Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'disappointed', label: 'Déçu' },
    { id: 'guilty', label: 'Coupable' },
    { id: 'euphoric', label: 'Euphorique' },
    { id: 'relieved', label: 'Soulagé' },
    { id: 'prefer_not_to_say', label: 'Je préfère ne pas répondre' },
  ];

  return (
    <QuestionTemplate
      currentStep={11}
      totalSteps={13}
      question="Comment vous sentez-vous après la masturbation ?"
      questionKey="post_masturbation_feeling"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/question-12"
    />
  );
}
