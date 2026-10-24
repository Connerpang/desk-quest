# 0011. Angular with standalone components, signals and the CDK

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

The spec requires Angular. The isometric map and its list view must be
usable by keyboard and screen reader (WCAG 2.2 AA), and check-in happens
mostly on phones.

## Decision

Use current stable **Angular** with standalone components and **signals**,
and the **Angular CDK** for accessibility primitives (focus management, live
announcements, overlays). The production build serves under a strict
Content Security Policy with no third-party origins.

## Consequences

- No NgModules; state is held in signals.
- Critical-CSS inlining is disabled in production builds, because it relies
  on an inline `onload` handler that the CSP blocks. Component styles still
  need `style-src 'unsafe-inline'`.
- No external fonts, CDNs or analytics at runtime (data-inventory §1).
