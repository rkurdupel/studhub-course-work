# Student Platform Backend Design

## Overview

This document defines the backend design for the STUD HUB university demo application. The existing frontend is a separate React/Vite client. The backend must provide student authentication, student profile data, finance data, subject material access, chat, a simple assistant endpoint, and an admin interface for uploading subject files.

The backend is intended for a demo, not a production launch. The design therefore favors lower operational complexity, clear boundaries, and believable end-to-end behavior over advanced infrastructure.

## Goals

- Provide a backend that supports the current frontend flows with real persisted data.
- Use a stack that supports both API delivery and a built-in admin interface.
- Support real file uploads for subject materials and chat image attachments.
- Keep deployment simple enough for Docker-based local development and later EC2 deployment.
- Keep the data model extensible for later admin management of chat reminders and finance records.

## Non-Goals

- No production-grade real-time chat infrastructure.
- No multi-language content support.
- No custom admin frontend in v1.
- No payment gateway integration.
- No email verification, password reset, or social login in v1.
- No LLM integration in v1.

## Chosen Stack

- Django
- Django REST Framework
- PostgreSQL
- Django admin
- Local file storage for uploads in the demo environment
- Docker for containerization
- EC2 as the intended AWS deployment target

## Why Django

The project now requires both a frontend-facing API and an admin panel for subject material uploads. Django is the better fit than FastAPI because it provides:

- a built-in admin panel
- a mature ORM
- built-in authentication
- file handling support
- straightforward PostgreSQL integration

DRF is used to expose the data to the React frontend through JSON APIs.

## System Architecture

The backend will be a single Django project with multiple focused apps:

- `accounts` for student authentication and profile data
- `subjects` for fixed subjects and uploaded study materials
- `chat` for predefined groups, memberships, messages, and image attachments
- `finance` for student finance data
- `assistant` for simple rule-based assistant responses
- `api` for shared API composition if a central API module is preferred

The frontend remains a separate client application and communicates with the backend via HTTP APIs.

The admin side uses Django admin only in v1. No separate admin SPA is required.

## Deployment Shape

### Local / Demo Development

- Django app container
- PostgreSQL container
- mounted media directory for uploaded files

### AWS Demo Deployment

- single EC2 instance
- Docker Compose
- Django container
- PostgreSQL container
- optional Nginx reverse proxy container
- mounted persistent directory for media files

This design avoids the added complexity of ECS/Fargate and avoids moving file uploads to S3 in the first version.

## Domain Model

### Users and Profiles

The system uses one Django user system for both students and admins.

- Students authenticate through the app API with the email and password used during registration.
- Admins authenticate through Django admin using standard Django staff/superuser accounts.
- Student and admin accounts are not split into two separate auth systems.

#### User

Base Django user model responsibilities:

- email as login identity
- password hash
- admin flags such as `is_staff` and `is_superuser`

Recommendation: use a custom user model from project start with email as the primary identifier.

#### StudentProfile

Holds student-specific data:

- user
- full name
- course
- specialization
- funding type

`funding_type` should be modeled with internal values such as:

- `budget`
- `paid`

The frontend can still display Ukrainian labels.

## Finance Model

Finance behavior is determined during registration.

During registration the student manually provides:

- common identity/profile fields
- funding type
- finance details corresponding to that funding type

### BudgetFinanceProfile

Fields:

- student
- scholarship amount
- scholarship status
- next funding date

### PaidFinanceProfile

Fields:

- student
- tuition amount
- current debt
- payment deadline

### PaymentRequisites

Global requisites used for paid students:

- receiver name
- IBAN
- EDRPOU
- active flag

Only one active requisites record should be used by the finance response in v1.

### Finance Constraints

Each student must have exactly one finance branch:

- either a `BudgetFinanceProfile`
- or a `PaidFinanceProfile`

The chosen branch must match `StudentProfile.funding_type`.

## Subjects and Materials

Subjects are fixed in v1 and seeded by the backend.

Admins do not create subjects in the first version. They only manage files attached to those subjects.

### Subject

Fields:

- slug
- display name
- optional ordering field

Initial subjects should correspond to the frontend assumptions:

- higher mathematics
- physics
- programming
- algorithms
- databases
- computer networks

### SubjectMaterial

Fields:

- subject
- title
- file
- file size
- uploaded at
- optional original filename

Behavior:

- admins upload files through Django admin
- students can list materials
- students can open/download materials through API-backed endpoints

## Chat Model

Chat is intentionally simple in v1.

- polling-based updates
- no WebSockets
- text messages
- image attachments only
- no arbitrary file attachments

### ChatGroup

Fields:

- code
- display name
- type
- read-only flag

Expected predefined groups:

- `general`
- `reminders`
- specialization/course groups such as `sa-1`, `kn-2`, `ipz-4`

### ChatMembership

Fields:

- student
- group

Registration logic automatically enrolls each student into:

- general chat
- reminders chat
- one specialization/course chat

### ChatMessage

Fields:

- group
- sender
- text
- system flag
- created at

### ChatImageAttachment

Fields:

- message
- image

### Reminders Rules

The reminders group is read-only for students.

- admins or backend-side system logic create reminder messages
- students can read but cannot post there

In v1, reminders can be seeded or created later via admin-side extensions. Full reminder management is intentionally deferred.

## Assistant Model

The assistant is a simple deterministic demo feature.

It does not use an LLM in v1.

The assistant reads the authenticated student’s profile and finance data, then returns rule-based Ukrainian responses for topics such as:

- payment/debt
- scholarship
- deadlines
- requisites

Persistence is optional in v1.

Two acceptable implementation choices:

1. Stateless endpoint only
2. Minimal conversation history storage with conversation/message tables

Recommendation for v1: start stateless unless the frontend needs history persistence.

## Registration Flow

Registration is more than simple user creation. It is the main orchestration flow for student setup.

### Shared Registration Fields

- full name
- email
- password
- course
- specialization
- funding type

### Conditional Registration Fields

If `budget`:

- scholarship amount
- scholarship status
- next funding date

If `paid`:

- tuition amount
- current debt
- payment deadline

### Registration Side Effects

One successful registration must create:

- user
- student profile
- matching finance profile
- chat memberships for predefined groups

This flow should be transactional so partially created student records are not left behind on failure.

## Authentication Strategy

Students authenticate using the email and password used during registration.

Recommended API auth:

- DRF + JWT using `djangorestframework-simplejwt`

Why JWT:

- appropriate for a separate React frontend
- simple mobile-style API usage
- avoids CSRF/session coupling with the client app

Admins continue using Django admin authentication.

## API Design

### Auth

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`

Optional later:

- token refresh endpoint
- logout handling at the client/token layer

### Profile

- `GET /api/profile/`

### Subjects

- `GET /api/subjects/`
- `GET /api/subjects/{slug}/`
- `GET /api/subjects/{slug}/materials/`
- `GET /api/materials/{id}/open/`
- `GET /api/materials/{id}/download/`

### Finance

- `GET /api/finance/`

Response behavior:

- budget students receive scholarship-oriented fields
- paid students receive payment-oriented fields and requisites

### Chat

- `GET /api/chat/groups/`
- `GET /api/chat/groups/{group_id}/messages/`
- `POST /api/chat/groups/{group_id}/messages/`
- `POST /api/chat/groups/{group_id}/messages/image/`
- `GET /api/chat/groups/{group_id}/messages/latest/?after_id=...`

Polling behavior can be implemented with `after_id` or a timestamp parameter. `after_id` is the simpler initial contract.

### Assistant

- `POST /api/assistant/chat/`

Input:

- student message text

Output:

- one Ukrainian assistant response based on rule matching against profile/finance data

## Admin Responsibilities in v1

The first version admin scope is intentionally small.

Admins can:

- log into Django admin
- manage uploaded files for fixed subjects

Admins do not yet manage:

- finance records through custom workflows
- chat groups
- reminder message workflows
- assistant logic

This keeps the first version aligned with the approved scope.

## File Handling

### Subject Materials

- stored on disk in the media directory
- metadata stored in PostgreSQL
- uploaded through Django admin

### Chat Images

- stored on disk in the media directory
- metadata linked to chat messages in PostgreSQL

### Validation

Subject materials:

- allow common document formats required by the demo

Chat attachments:

- allow image MIME types only

## Authorization Rules

- authenticated students can access only their own profile/finance data
- students can access only groups they belong to
- students cannot post to read-only reminder groups
- admin pages are accessible only to staff/superusers
- subject material access can remain available to authenticated students only

## Error Handling

Expected API behavior:

- invalid registration data returns field-level validation errors
- duplicate email returns validation error
- unauthenticated requests return `401`
- unauthorized resource actions return `403`
- missing resources return `404`
- invalid image upload returns `400`
- student attempts to post in reminders return `403`

## Testing Strategy

The backend should be implemented test-first and covered with focused automated tests.

### Model Tests

- student profile creation constraints
- funding-type-to-finance-profile consistency
- subject material relations
- chat membership rules

### API Tests

- registration flow
- login and authenticated `me` endpoint
- subject and material listing
- material open/download access
- finance response by funding type
- chat group visibility by membership
- student message posting
- reminder-group posting rejection
- chat image upload validation
- assistant responses for budget and paid students

### Integration Expectations

The highest-risk flow is registration because it creates several related records. This should have strong end-to-end test coverage.

## Suggested App Boundaries

### `accounts`

Owns:

- custom user model
- student profile
- auth serializers/views

### `finance`

Owns:

- budget finance profile
- paid finance profile
- payment requisites
- finance serializers/views

### `subjects`

Owns:

- subject seed data
- subject material model
- subject/material APIs
- admin registrations for materials

### `chat`

Owns:

- chat groups
- memberships
- messages
- image attachments
- polling endpoints

### `assistant`

Owns:

- rule-based response logic
- optional message history

These boundaries keep the system readable and allow later expansion without collapsing all logic into a single large app.

## Seed Data

The backend should seed:

- fixed subjects
- predefined chat groups
- optional sample reminders
- optional payment requisites

This ensures a fresh demo environment is usable immediately.

## Deferred Work

The following items are explicitly out of scope for v1 but should remain possible later:

- admin editing of finance records
- admin reminder management
- admin chat management
- real-time chat via WebSockets
- S3-based file storage
- advanced assistant behavior
- multi-language content

## Final Recommendation

Build the backend as a Django + DRF project with PostgreSQL, JWT auth for students, Django admin for subject file management, local media storage for the demo, and simple polling-based chat. This matches the current frontend needs, keeps the first version realistic, and avoids unnecessary infrastructure complexity.
