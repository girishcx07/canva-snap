import type { AnchorHTMLAttributes } from 'react'

import type { RscNavigationCacheMode } from './navigation'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  cache?: RscNavigationCacheMode
  href: string
}

export function Link({ cache = 'default', ...props }: LinkProps) {
  return (
    <a
      data-rsc-cache={cache === 'default' ? undefined : cache}
      {...props}
    />
  )
}
