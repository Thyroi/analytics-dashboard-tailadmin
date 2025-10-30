import { CARD_CLASS } from "./constants";

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className={CARD_CLASS}>
      <div className="card-body text-red-500">{message}</div>
    </div>
  );
}
