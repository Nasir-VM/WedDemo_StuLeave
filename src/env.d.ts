/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./lib/auth/session').SessionUser | null;
    session: import('./lib/auth/session').SessionData | null;
    csrfToken: string;
    clientIp: string;
  }
}
