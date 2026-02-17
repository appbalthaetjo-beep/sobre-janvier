import React, { useState } from 'react';
import QuestionTemplate from '@/components/onboarding/QuestionTemplate';

export default function PastAttemptsScreen() {
  const [selectedChoice, setSelectedChoice] = useState<string>();

  const choices = [
    { id: 'yes_easy', label: '\u2705 Oui, et ce n\u2019\u00e9tait pas difficile' },
    { id: 'yes_somewhat', label: '\u{1F914} Oui, mais c\u2019\u00e9tait un peu difficile' },
    { id: 'yes_very', label: '\u{1F613} Oui, et c\u2019\u00e9tait tr\u00e8s difficile' },
    { id: 'no_first_time', label: '\u{1F645} Non, c\u2019est la premi\u00e8re fois' },
  ];

  return (
    <QuestionTemplate
      currentStep={1}
      totalSteps={1}
      question={'As-tu d\u00e9j\u00e0 essay\u00e9 d\u2019arr\u00eater le porno ?\nComment \u00e7a s\u2019est pass\u00e9 ?'}
      questionKey="past_porn_change_attempt"
      choices={choices}
      onSelect={setSelectedChoice}
      selectedChoice={selectedChoice}
      showSkip={false}
      nextRoute="/onboarding/rewiring-advantages"
    />
  );
}

