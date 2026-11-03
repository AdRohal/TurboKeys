'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

/**
 * The pages were written for react-router (`<Link to>` and `useNavigate`). These two keep that shape on top of the Next.js
 * router, so the pages did not have to be rewritten to move to Next.js.
 */
type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & { to: string };

export const Link = ({ to, ...rest }: LinkProps) => <NextLink href={to} {...rest} />;

export function useNavigate() {
  const router = useRouter();
  return React.useCallback((to: string, options?: { replace?: boolean }) => (options?.replace ? router.replace(to) : router.push(to)), [router]);
}
