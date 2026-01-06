import { useEffect, useRef, useState } from 'react';

interface UseTypewriterMessagesOptions {
  messages: string[];
  letterDelay?: number;
  messageDelay?: number;
  onType?: () => void;
  onFinished?: () => void;
}

export function useTypewriterMessages({
  messages,
  letterDelay = 45,
  messageDelay = 1200,
  onType,
  onFinished,
}: UseTypewriterMessagesOptions) {
  const onTypeRef = useRef(onType);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onTypeRef.current = onType;
  }, [onType]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [finished, setFinished] = useState(false);

  const letterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    if (!messages.length) {
      setDisplayedText('');
      setFinished(true);
      return;
    }

    if (currentIndex >= messages.length) {
      setCurrentIndex(0);
      return;
    }

    runIdRef.current += 1;
    const runId = runIdRef.current;

    if (letterTimeoutRef.current) {
      clearTimeout(letterTimeoutRef.current);
    }
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    const currentMessage = messages[currentIndex] ?? '';
    const characters = Array.from(currentMessage);

    setDisplayedText('');
    setFinished(false);

    const typeNextCharacter = (charIndex: number) => {
      if (runIdRef.current !== runId) return;

      const nextChar = characters[charIndex];
      if (nextChar === undefined) return;

      setDisplayedText(characters.slice(0, charIndex + 1).join(''));
      onTypeRef.current?.();

      if (charIndex + 1 < characters.length) {
        letterTimeoutRef.current = setTimeout(
          () => typeNextCharacter(charIndex + 1),
          letterDelay
        );
        return;
      }

      messageTimeoutRef.current = setTimeout(() => {
        if (runIdRef.current !== runId) return;

        if (currentIndex < messages.length - 1) {
          setCurrentIndex((value) => value + 1);
          return;
        }

        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setFinished(true);
          onFinishedRef.current?.();
        }
      }, messageDelay);
    };

    letterTimeoutRef.current = setTimeout(() => typeNextCharacter(0), letterDelay);

    return () => {
      runIdRef.current += 1;
      if (letterTimeoutRef.current) {
        clearTimeout(letterTimeoutRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [currentIndex, letterDelay, messageDelay, messages]);

  return {
    currentIndex,
    displayedText,
    finished,
  };
}
