# Kelulusan Plugin

## Overview

Scaffold package for the `kelulusan` plugin with storage and route surface for NISN-gated graduation result delivery.

## Status

- Package: `@emdash-cms/plugin-kelulusan`
- Version: `0.0.1`
- Format: `standard`
- Entrypoint: `@emdash-cms/plugin-kelulusan/sandbox`

## Capabilities

- `media:read` - required for PDF retrieval flow

## Storage and indexes

- `students`
  - unique index: `nisn`
  - indexes: `nisn`, `name`, `createdAt`
- `document_events`
  - indexes: `studentId`, `eventType`, `actorType`, `createdAt`

## Routes (scaffold)

- `admin` - Block Kit page scaffold for `/kelulusan`
- `students/list` - stub list route
- `students/upsert` - admin route for creating/updating student records
- `students/get-by-nisn` - public student lookup by NISN
- `gate/session/start` - public NISN gate session issuer with short-lived access token
- `documents/access/public` - NISN + gate token PDF access with telemetry event
- `documents/access/admin` - authenticated admin PDF access with telemetry event

## Notes

This package intentionally provides only the issue #69 scaffold. Business logic, access control, telemetry persistence, and viewers are implemented in follow-up issues.
