export type FeedbackRequest = {
  context: string;
  presetMessage?: string;
};

export type FeedbackListener = (request: FeedbackRequest) => void;

let listener: FeedbackListener | null = null;

export function registerFeedbackListener(fn: FeedbackListener) {
  listener = fn;
  return () => {
    if (listener === fn) {
      listener = null;
    }
  };
}

export function requestFeedback(request: FeedbackRequest) {
  if (listener) {
    listener(request);
  } else if (__DEV__) {
    console.warn('[Feedback] No feedback listener registered.');
  }
}
