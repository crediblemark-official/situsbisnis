"use client";

import React, { useState } from "react";
import NextLink, { LinkProps } from "next/link";

export interface LazyLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
  title?: string;
}

/**
 * A custom replacement for next/link that only triggers prefetching
 * when the user intends to navigate (hover / pointer enter, focus, or touch start).
 * This reduces waste and saves server resources.
 */
export function LazyLink({ children, ...props }: LazyLinkProps) {
  const [isPrefetched, setIsPrefetched] = useState(false);

  const handleTriggerPrefetch = () => {
    if (!isPrefetched) {
      setIsPrefetched(true);
    }
  };

  return (
    <NextLink
      prefetch={isPrefetched ? undefined : false}
      onPointerEnter={handleTriggerPrefetch}
      onFocus={handleTriggerPrefetch}
      onTouchStart={handleTriggerPrefetch}
      {...props}
    >
      {children}
    </NextLink>
  );
}
