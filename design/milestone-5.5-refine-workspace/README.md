# Refine workspace — actual application evidence

October 9, 2026. Disposable fictional records; all provider responses injected
locally. Captures are unretouched real Next.js development pages.

| State                    | 1440 CSS px                   | 768 CSS px                  | 390 CSS px                  | 320 CSS px                  |
| ------------------------ | ----------------------------- | --------------------------- | --------------------------- | --------------------------- |
| Company queue            | [Desktop](hub-1440.jpg)       | [Tablet](hub-768.jpg)       | [Mobile](hub-390.jpg)       | [Narrow](hub-320.jpg)       |
| Unreviewed proposal      | [Desktop](suggested-1440.jpg) | [Tablet](suggested-768.jpg) | [Mobile](suggested-390.jpg) | [Narrow](suggested-320.jpg) |
| Edited accepted          | [Desktop](accepted-1440.jpg)  | [Tablet](accepted-768.jpg)  | [Mobile](accepted-390.jpg)  | [Narrow](accepted-320.jpg)  |
| Multiple versions        | [Desktop](multiple-1440.jpg)  | [Tablet](multiple-768.jpg)  | [Mobile](multiple-390.jpg)  | [Narrow](multiple-320.jpg)  |
| Pending                  | [Desktop](pending-1440.jpg)   | [Tablet](pending-768.jpg)   | [Mobile](pending-390.jpg)   | [Narrow](pending-320.jpg)   |
| Long original + proposal | [Desktop](long-1440.jpg)      | [Tablet](long-768.jpg)      | [Mobile](long-390.jpg)      | [Narrow](long-320.jpg)      |
| Original only            | [Desktop](original-1440.jpg)  | [Tablet](original-768.jpg)  | [Mobile](original-390.jpg)  | [Narrow](original-320.jpg)  |
| Rejected                 | [Desktop](rejected-1440.jpg)  | [Tablet](rejected-768.jpg)  | [Mobile](rejected-390.jpg)  | [Narrow](rejected-320.jpg)  |
| Empty queue              | [Desktop](empty-1440.jpg)     | [Tablet](empty-768.jpg)     | [Mobile](empty-390.jpg)     | [Narrow](empty-320.jpg)     |
| Archived queue           | [Desktop](archived-1440.jpg)  | [Tablet](archived-768.jpg)  | [Mobile](archived-390.jpg)  | [Narrow](archived-320.jpg)  |

Additional interaction views:

- [Focused mobile proposal](mobile-comparison-proposal-390-viewport.jpg), [original](mobile-comparison-original-390-viewport.jpg), [review focus](mobile-review-focus-390-viewport.jpg).
- [Mobile original selection](mobile-original-320.jpg), [sequential comparison](mobile-both-320.jpg), [editing](mobile-edit-320.jpg), [accepted result](mobile-accepted-after-edit-320.jpg).
- [Off-page superseded target with current acceptance](superseded-off-page-1440.jpg), [archived detail](archived-detail-1440.jpg).
- [DOM geometry](geometry.json), [off-page workflow](workflow.json), [runtime warnings/errors](runtime-log.json).

Forty main measurements were taken before full-page export at scroll zero.
Screenshot pixel size is not CSS viewport size. The in-app capture surface scales
and can append blank canvas; full-page mobile exports place the fixed rail at the
initial viewport bottom, sometimes overlapping a later exported band. Focused
viewport captures show scrolled interaction states. No CSS alignment change was
inferred from image scaling or temporary scrollbar removal during export.

CSS zoom=1, visual viewport scale=1, DPR approximately 0.8. Native browser zoom
percentage is unverified. Physical phone keyboard, safe-area insets, native
100%/80% zoom and assistive screen-reader checks remain manual. No claim of final
visual or accessibility acceptance. See [implementation notes](../../docs/19-milestone-5.5-refine-workspace-notes.md).
