import React from 'react';
import ClarioChat from '@/components/ClarioChat';
import { router } from 'expo-router';

export default function AITherapistScreen() {
  const handleClose = () => {
    router.back(); // Retourne à la page précédente (library)
  };

  return <ClarioChat onClose={handleClose} />;
}