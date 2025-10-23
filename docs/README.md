# Documentation Index

This is a comprehensive index of all documentation in the meal planner project, organized by category and purpose.

## 📚 Core Documentation

### Project Overview
- **[README.md](../README.md)** - Main project documentation with tech stack, features, and quick start guide
- **[TECHNICAL_DEBT_IMPLEMENTATION.md](../TECHNICAL_DEBT_IMPLEMENTATION.md)** - Complete technical debt tracking system implementation
- **[TECHNICAL_DEBT_REPORT.md](../TECHNICAL_DEBT_REPORT.md)** - Current technical debt status and recommendations

### Architecture & Design
- **[docs/architecture.md](architecture.md)** - System architecture, data flow, and service layer patterns
- **[docs/data-models.md](data-models.md)** - Database schemas and data structures
- **[docs/design-system.md](design-system.md)** - UI components and design tokens
- **[patterns.md](../patterns.md)** - Code patterns, conventions, and best practices

### Development & Setup
- **[docs/env-setup.md](env-setup.md)** - Environment variables and local/production setup
- **[docs/testing.md](testing.md)** - Testing framework, strategies, and best practices
- **[docs/security.md](security.md)** - Security implementation and best practices
- **[docs/network-resilience.md](network-resilience.md)** - Offline handling and network resilience

### Technical Debt Management
- **[docs/technical-debt-management.md](technical-debt-management.md)** - Comprehensive guide to technical debt tracking and management
- **[src/utils/technicalDebtTracker.js](../src/utils/technicalDebtTracker.js)** - Core technical debt tracking system
- **[scripts/debt-report.js](../scripts/debt-report.js)** - CLI tools for debt management

## 🚀 Feature Documentation

### Core Features
- **[docs/features/shopping-list.md](features/shopping-list.md)** - Shopping List feature implementation and architecture
- **[docs/features/ai-meal-planner-v2.md](features/ai-meal-planner-v2.md)** - AI Meal Planner V2 feature documentation
- **[docs/features/tag-management.md](features/tag-management.md)** - Tag Management System documentation

### AI & External Services
- **[docs/ai-services.md](ai-services.md)** - AI service integration and architecture
- **[netlify/functions/claude.js](../netlify/functions/claude.js)** - Claude API proxy implementation

### Progressive Web App
- **[docs/pwa.md](pwa.md)** - Progressive Web App configuration and setup

## 🏗️ Architecture Decision Records (ADRs)

### Storage & Data
- **[docs/adr/ADR-0001-dual-storage.md](adr/ADR-0001-dual-storage.md)** - Dual Storage Architecture (Supabase + IndexedDB)
- **[docs/adr/ADR-0002-ai-proxy.md](adr/ADR-0002-ai-proxy.md)** - AI Service Architecture (Node.js Proxy)

## 📋 Checklists & Guidelines

### Quality Assurance
- **[docs/checklists/crud-quality.md](checklists/crud-quality.md)** - CRUD app quality checklist and implementation guidelines

## 🔄 Migration Documentation

### Database Migrations
- **[docs/migrations/2025-10-22-shopping-list.md](migrations/2025-10-22-shopping-list.md)** - Shopping List Tables Migration
- **[supabase-migration-add-meal-role.sql](../supabase-migration-add-meal-role.sql)** - Meal role migration SQL
- **[supabase-migration-add-name.sql](../supabase-migration-add-name.sql)** - Name field migration SQL
- **[supabase-migration-add-sort-order.sql](../supabase-migration-add-sort-order.sql)** - Sort order migration SQL

## 🛠️ Setup & Configuration

### Environment Setup
- **[SUPABASE_SETUP.md](../SUPABASE_SETUP.md)** - Supabase project setup and configuration
- **[EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md)** - Email service configuration guide
- **[DATA_MANAGEMENT.md](../DATA_MANAGEMENT.md)** - Data management and migration strategies

### Development Tools
- **[DESIGN_SYSTEM_REFACTOR.md](../DESIGN_SYSTEM_REFACTOR.md)** - Design system refactoring documentation
- **[SORT_ORDER_MIGRATION_GUIDE.md](../SORT_ORDER_MIGRATION_GUIDE.md)** - Sort order migration guide

## 📊 Technical Debt Status

### Current Debt Metrics
- **Total Debts**: 16 items tracked
- **High Priority**: 2 items requiring immediate attention
- **Medium Priority**: 7 items for planned improvements
- **Low Priority**: 7 items for future consideration

### High Priority Items
1. **SavedPlans.jsx:85** - Uses alert() instead of proper toast notification system
2. **security.js:9** - Regex-based HTML sanitization is vulnerable to bypasses

### Debt Management Tools
```bash
# Generate comprehensive debt report
npm run debt:report

# Validate all debt annotations
npm run debt:validate

# Show debt statistics
npm run debt:stats
```

## 🎯 Quick Reference

### Essential Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage

# Technical Debt
npm run debt:report  # Generate debt report
npm run debt:validate # Validate annotations
npm run debt:stats   # Show statistics

# Code Quality
npm run lint         # Run ESLint
```

### Key File Locations
- **Service Layer**: `src/services/` - Business logic and data access
- **Components**: `src/components/` - React UI components
- **Utilities**: `src/utils/` - Helper functions and utilities
- **Database**: `src/database/` - Data access implementations
- **Tests**: `src/tests/` and `**/*.test.js` - Test files
- **Documentation**: `docs/` - All project documentation

### Architecture Patterns
- **Service Layer Pattern**: Clean separation between UI and data access
- **Dual Storage Strategy**: Supabase (cloud) + IndexedDB (local) with automatic selection
- **Error Boundary Pattern**: Graceful error handling in React components
- **Hook Pattern**: Custom hooks for reusable logic
- **Technical Debt Tracking**: AI-friendly annotations for code quality management

## 📈 Documentation Maintenance

### Keeping Documentation Current
- Update README.md when adding new features or changing tech stack
- Add ADRs for significant architectural decisions
- Update technical debt annotations when making shortcuts
- Keep feature documentation synchronized with implementation
- Review and update this index when adding new documentation

### Documentation Standards
- Use clear, descriptive titles and headings
- Include code examples where helpful
- Provide both high-level overview and detailed implementation
- Keep documentation close to code (co-located when possible)
- Use consistent formatting and structure

---

**Last Updated**: January 2025  
**Maintained By**: Development Team  
**Purpose**: Comprehensive reference for all project documentation