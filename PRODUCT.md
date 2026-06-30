# Product

## Register

product

## Users

The primary user is the project owner logging personal finance activity on a phone, usually at the moment a transaction happens or shortly after. They need to capture expenses, income, and transfers quickly without turning daily logging into bookkeeping work.

The user is often in a low-attention, mobile context: walking away from a cashier, checking a banking app, reviewing the last few logs, or correcting a recent mistake.

## Product Purpose

This product is a mobile-first finance logger built on Google Sheets and Google Apps Script. Google Sheets is the source of truth; the web app is the fast input layer.

Success for the first version means a normal expense can be logged in about 5-10 seconds, recent mistakes can be edited or soft-deleted safely, and the workbook remains understandable for manual review.

The product deliberately starts with one excellent Quick Log workflow before adding insights, dashboards, charts, or tax review surfaces.

## Brand Personality

Calm, practical, trustworthy.

The interface should feel like a clear daily tool: quiet enough to use repeatedly, structured enough to prevent bad data, and responsive enough that logging feels lighter than remembering.

## Anti-references

- Not a marketing landing page.
- Not a dashboard-first finance app.
- Not a chart-heavy analytics product.
- Not a decorative fintech interface with oversized cards, loud gradients, or ornamental motion.
- Not a spreadsheet replacement that hides how the workbook works.
- Not tax software; tax fields are review flags only.

## Design Principles

- Fast capture first: every screen should reduce friction for logging a real transaction.
- Structured, not fussy: capture reliable fields while leaving memo for human context.
- One source of truth: the UI writes to `Transactions`; filtered views are convenience views.
- Safe correction: edit recent rows and soft-delete mistakes without destroying history.
- Mobile is the default working environment, not a secondary breakpoint.

## Accessibility & Inclusion

Target WCAG AA contrast for text and controls. Use familiar form controls, visible focus states, clear touch targets, and state labels that are not color-only. Respect reduced-motion preferences. Keep the interface usable on small mobile screens and in quick, distracted sessions.
