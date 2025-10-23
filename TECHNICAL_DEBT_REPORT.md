# Technical Debt Report

## Summary
- Total debts: 14
- High priority: 2

## By Priority
- medium: 6
- low: 6
- high: 2

## High Priority Debts
- **src/components/SavedPlans.jsx:85** - Uses alert() instead of proper toast notification system
  - Priority: high, Effort: medium, Impact: high
- **src/utils/security.js:9** - Regex-based HTML sanitization is vulnerable to bypasses
  - Priority: high, Effort: medium, Impact: high
