"use client";

import { GridLayout } from "./GridLayout";
import type { SectorsGridDetailedProps } from "./types";
import { useExpandedState } from "./useExpandedState";

export default function SectorsGridDetailed(props: SectorsGridDetailedProps) {
  const { expandedId, expandedRef, handleOpen, handleClose } = useExpandedState(
    {
      controlledExpandedId: props.expandedId,
      onOpen: props.onOpen,
      onClose: props.onClose,
    }
  );

  return (
    <GridLayout
      {...props}
      expandedId={expandedId}
      expandedRef={expandedRef}
      handleOpen={handleOpen}
      handleClose={handleClose}
    />
  );
}

export type { Mode, SectorsGridDetailedProps } from "./types";
