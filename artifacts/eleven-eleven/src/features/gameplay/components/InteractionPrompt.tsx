interface InteractionPromptProps {
  prompt: string | null;
  onInteract: () => void;
}

export function InteractionPrompt({
  prompt,
  onInteract,
}: InteractionPromptProps) {
  if (!prompt) return null;

  return (
    <div
      className="gameplay-interaction-prompt"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={onInteract}
        aria-label={prompt}
      >
        <kbd>E</kbd>
        <span>{prompt}</span>
      </button>
    </div>
  );
}
