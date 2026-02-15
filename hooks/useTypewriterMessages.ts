import { useCallback, useEffect, useRef, useState } from 'react';

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
  const messagesRef = useRef(messages);
  const messageDelayRef = useRef(messageDelay);

  useEffect(() => {
    onTypeRef.current = onType;
  }, [onType]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messageDelayRef.current = messageDelay;
  }, [messageDelay]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [finished, setFinished] = useState(false);

  const currentIndexRef = useRef(0);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const letterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const currentMessageRef = useRef('');
  const typedCountRef = useRef(0);
  const messageLengthRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (letterTimeoutRef.current) {
      clearTimeout(letterTimeoutRef.current);
      letterTimeoutRef.current = null;
    }
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }
  }, []);

  const advanceMessage = useCallback(() => {
    const currentMessages = messagesRef.current;
    const idx = currentIndexRef.current;

    if (!currentMessages.length) {
      setDisplayedText('');
      setFinished(true);
      return;
    }

    if (idx < currentMessages.length - 1) {
      setCurrentIndex(idx + 1);
      return;
    }

    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setFinished(true);
      onFinishedRef.current?.();
    }
  }, []);

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

    clearTimers();

    const currentMessage = messages[currentIndex] ?? '';
    const characters = Array.from(currentMessage);

    currentMessageRef.current = currentMessage;
    typedCountRef.current = 0;
    messageLengthRef.current = characters.length;

    setDisplayedText('');
    setFinished(false);

    if (characters.length === 0) {
      messageTimeoutRef.current = setTimeout(() => {
        if (runIdRef.current !== runId) return;
        advanceMessage();
      }, messageDelay);
      return;
    }

    const typeNextCharacter = (charIndex: number) => {
      if (runIdRef.current !== runId) return;

      const nextChar = characters[charIndex];
      if (nextChar === undefined) return;

      setDisplayedText(characters.slice(0, charIndex + 1).join(''));
      typedCountRef.current = charIndex + 1;
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
        advanceMessage();
      }, messageDelay);
    };

    letterTimeoutRef.current = setTimeout(() => typeNextCharacter(0), letterDelay);

    return () => {
      runIdRef.current += 1;
      clearTimers();
    };
  }, [advanceMessage, clearTimers, currentIndex, letterDelay, messageDelay, messages]);

  const tapToContinue = useCallback(() => {
    if (finished) return;

    const currentMessage = currentMessageRef.current;
    const messageLength = messageLengthRef.current;

    runIdRef.current += 1;
    const runId = runIdRef.current;

    clearTimers();

    if (typedCountRef.current < messageLength) {
      setDisplayedText(currentMessage);
      typedCountRef.current = messageLength;

      messageTimeoutRef.current = setTimeout(() => {
        if (runIdRef.current !== runId) return;
        advanceMessage();
      }, messageDelayRef.current);

      return;
    }

    advanceMessage();
  }, [advanceMessage, clearTimers, finished]);

  return {
    currentIndex,
    displayedText,
    finished,
    tapToContinue,
  };
}
