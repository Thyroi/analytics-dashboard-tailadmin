import { useEffect, useRef, useState } from "react";

type UseExpandedStateProps = {
  controlledExpandedId?: string | null;
  onOpen?: (id: string) => void;
  onClose?: () => void;
};

export function useExpandedState({
  controlledExpandedId,
  onOpen,
  onClose,
}: UseExpandedStateProps) {
  const [uncontrolled, setUncontrolled] = useState<string | null>(null);
  const expandedRef = useRef<HTMLDivElement | null>(null);

  const expandedId =
    controlledExpandedId !== undefined ? controlledExpandedId : uncontrolled;

  const handleOpen = (id: string) =>
    onOpen ? onOpen(id) : setUncontrolled(id);
  const handleClose = () => (onClose ? onClose() : setUncontrolled(null));

  // Auto-scroll cuando aparece el expandido
  useEffect(() => {
    if (!expandedId) return;
    const t = setTimeout(() => {
      expandedRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
    return () => clearTimeout(t);
  }, [expandedId]);

  return { expandedId, expandedRef, handleOpen, handleClose };
}
