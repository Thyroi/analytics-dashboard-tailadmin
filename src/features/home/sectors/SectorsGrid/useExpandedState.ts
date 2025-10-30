import { useState } from "react";

interface UseExpandedStateProps {
  controlledExpandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;
}

export function useExpandedState({
  controlledExpandedId,
  onOpen,
  onClose,
}: UseExpandedStateProps) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);

  const expandedId =
    controlledExpandedId !== undefined ? controlledExpandedId : uncontrolled;

  const handleOpen = (id: string) =>
    onOpen ? onOpen(id) : setUncontrolled(id);

  const handleClose = () => (onClose ? onClose() : setUncontrolled(null));

  return { expandedId, handleOpen, handleClose };
}
