# Implementation Plan - Rate Limit UI Refactor

## Goal
Improve the Rate Limit Configuration UI to be more interactive and visually distinct. Users should be able to select a tier, enter an edit mode, and save changes specifically for that tier.

## User Review Required
> [!NOTE]
> The "Save" button will now be specific to the tier being edited, rather than a global save button at the bottom.

## Proposed Changes

### Frontend Components

#### [MODIFY] [frontend/src/components/dashboard/admin/settings/RateLimitConfig.tsx](file:///home/cosmic-soul/Desktop/clientpdf/ultra-scraper/frontend/src/components/dashboard/admin/settings/RateLimitConfig.tsx)
- Add state: `selectedTier` ('free' | 'pro' | null)
- Add state: `isEditing` (boolean)
- Add state: `editValues` (temporary state for inputs)
- Refactor UI into selectable cards.
- Implement "Edit" button that appears on selection.
- Implement "Save" and "Cancel" buttons that appear during editing.
- Add visual highlighting (border, shadow) for the selected tier.

## Verification Plan

### Automated Tests
- None (UI interaction change).

### Manual Verification
1. Navigate to `/admin/rate-limits`.
2. Click on "Free Tier" card -> Verify it highlights.
3. Verify "Edit" button appears.
4. Click "Edit" -> Verify inputs appear and "Save"/"Cancel" buttons show.
5. Modify values and click "Save" -> Verify toast success and values update.
6. Repeat for "Pro Tier".
7. Verify "Cancel" reverts changes.
