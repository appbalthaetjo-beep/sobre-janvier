import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function Question13Screen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'yes', label: 'Oui' },
    { id: 'no', label: 'Non' },
  ];

  const details = [
    '🧠 Brouillard mental persistant (difficile de se concentrer)',
    '💔 Problèmes de confiance ou d’estime de soi',
    '😰 Anxiété sociale en hausse',
    '🚀 Manque de motivation pour commencer ou terminer des tâches',
    '🎯 Difficultés de concentration',
    '💞 Perte d’intérêt pour l’intimité',
    '🍆 Difficultés d’érection',
  ];

  return (
    <QuestionTemplate
      currentStep={13}
      totalSteps={13}
      question="Avez-vous remarqué l’un de ces effets récemment ?"
      details={details}
      questionKey="recent_effects"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      nextRoute="/onboarding/loading"
    />
  );
}

