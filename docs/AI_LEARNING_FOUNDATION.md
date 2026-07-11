# VINCIS AI Learning Foundation

This document is the protected inventory for all AI learning, memory, preference, DNA, and ranking foundation assets in VINCIS.

These systems are platform infrastructure. They may be upgraded, migrated, versioned, or expanded, but they must not be deleted as "zombie code" without an owner-approved migration plan.

## Protection Rule

AI learning assets are not ordinary feature code.

- Do not delete AI learning tables, models, repositories, services, events, or rules just because current UI usage is incomplete.
- Do not replace AI learning with hard-coded scoring.
- Do not implement Creator saves as a simple `creator_likes` table.
- Do not remove memory or DNA fields during cleanup.
- Any rename, migration, or replacement must preserve historical learning data.
- Any new learning table linked to Campaign must include `campaign_id`.
- AI learning rules must be configurable and versionable.

## Canonical Documents

| Document | Purpose |
| --- | --- |
| `docs/AI_PREFERENCE_ENGINE.md` | Product and engine rules for Save Creator, Brand AI Taste, Preference Vector, and configurable learning weights |
| `docs/AI_CREATIVE_COLLABORATION_FLOW.md` | Post-payment Brand-Creator AI creative draft, deepening, confirmation, and token-control rules |
| `docs/AI_LEARNING_FOUNDATION.md` | Protected inventory of current AI learning database and engine assets |
| `docs/VINCIS_ORDER_LIFECYCLE_SPEC.md` | Lifecycle rules that AI learning must not bypass |
| `docs/STUDIOOS_ROADMAP.md` | Strategic engine roadmap marker |
| `重要AI数据库开发文档.pdf` | AI Platform / AI Database long-term architecture reference |
| `重要开发需求（AI询单学习能力）.pdf` | AI inquiry, refusal reason, budget health, and staged matching learning reference |
| `AI客服系统开发文档.pdf` | AI Copilot / StudioOS Brain data access and action rules |
| `语言数据库文档.pdf` | Shared language database for UI, AI, email, notification, and admin copy |
| `系统200条回复第一版.pdf` | System reply knowledge base and AI customer support tone reference |

## Database Foundation

### Prisma Models

| Model | Table | Category | Purpose |
| --- | --- | --- | --- |
| `AiPreference` | `ai_preferences` | User preference | Per-user communication and behavior preference settings |
| `MemoryFact` | `memory_facts` | Long-term memory | Brand / Creator / Campaign / Relationship facts extracted from behavior and AI analysis |
| `RelationshipDna` | `relationship_dna` | Relationship intelligence | Brand-Creator collaboration history and trust score |
| `AIEvent` | `ai_events` | Learning event log | Raw AI learning events and behavior signals |
| `AILearning` | `ai_learning` | Learning result | Normalized learning records derived from `AIEvent` |
| `AiJob` | `ai_jobs` | AI operations | AI task execution, provider, input, output, and status |
| `ConnectedChannel.aiLearningEnabled` | `connected_channels.ai_learning_enabled` | Creator data source | Whether a connected creator channel can be used for AI learning |
| `AiKnowledgeQa` | `ai_knowledge_qa` | Knowledge base | System reply library, QA retrieval, usage count, helpful/not-helpful feedback |
| `ChatSession` | `chat_sessions` | Copilot session | AI Copilot conversation session and audit scope |
| `ChatMessage` | `chat_messages` | Copilot message | AI Copilot user/assistant messages |
| `AiToolCall` | `ai_tool_calls` | Tool audit | Copilot tool call trace and structured output |
| `AiCopilotContext` | `ai_copilot_contexts` | Context snapshot | Current page/entity context for AI assistant grounding |
| `CreatorAiConfig` | `creator_ai_configs` | Creator support AI | Creator AI persona, FAQ, pricing rules, and multilingual behavior |
| `Conversation` | `conversations` | AI support / inquiry | AI support and inquiry conversation container |
| `ConversationMessage` | `conversation_messages` | AI support / inquiry | User and assistant messages for support/inquiry learning |
| `CommunicationMessage` | `communication_messages` | Cross-language collaboration | Brand-Creator messages that feed translation and memory context |
| `CommunicationTranslationLog` | `communication_translation_logs` | Translation audit | AI translation provider, cost, latency, success/failure trace |
| `Language` | `languages` | i18n database | Supported language registry |
| `LanguageKey` | `language_keys` | i18n database | Shared translation keys for UI, AI, email, notifications, errors, and admin |
| `LanguageTranslation` | `language_translations` | i18n database | Editable localized values |
| `PerformanceSource` | `performance_sources` | Creative performance | Imported performance evidence and attribution signal source |
| `Attribution` | `attributions` | Creative performance | Conversion attribution chain for creative and creator learning |
| `PartnerProgram` | `partner_programs` | Ecosystem data | Partner/Academy program data that may become AI/business intelligence |
| `AcademyCourse` | `academy_courses` | Ecosystem data | Academy course data and future creator capability signal |
| `EmailLog` | `email_logs` | Communication audit | Email lifecycle delivery trace and future email quality learning input |

### Future Canonical AI Database Families

The AI Engineering Bible defines the long-term target as a unified AI Platform, not scattered OpenAI calls or temporary tables. Current tables may be earlier implementations, but future migrations should converge toward these protected families:

| Family | Purpose |
| --- | --- |
| `AIMemory` | Unified long-term memory across profile, preference, behavior, matching, review, payment, risk, delivery, and settlement |
| `AIKnowledge` | Structured platform knowledge, policies, system reply library, help content, and product rules |
| `AIEmbedding` | Vector index entries for memory, creator portfolios, briefs, replies, and knowledge |
| `AIEvent` | Raw behavior and system event log |
| `AIJob` | AI task execution records |
| `AILearning` | Processed learning outcomes from events |
| `AIDecision` | Traceable AI recommendations and decisions |
| `AIFeedback` | Human feedback on AI suggestions, matches, replies, and decisions |
| `AIModel` | Provider/model routing metadata |
| `AIPrompt` | Versioned prompt templates and prompt policy |

### Migration Files

| File | Purpose |
| --- | --- |
| `supabase/migrations/007_ai_memory.sql` | Supabase AI memory tables and enums |
| `prisma/migrations/20250630120000_init/migration.sql` | Initial Prisma schema including AI memory primitives |

## Engine Modules

### Memory Layer

| File | Category | Purpose |
| --- | --- | --- |
| `features/memory/memory.repository.ts` | Repository | CRUD for preferences, memory facts, and relationship DNA |
| `features/memory/memory.service.ts` | Service | Builds memory context bundles for AI and communication |
| `features/memory/memory-extraction.service.ts` | Service | Extracts facts from content |
| `features/memory/memory-resolution.service.ts` | Service | Resolves memory into prompt-ready context |
| `features/memory/ai-preference.service.ts` | Service | Reads and updates per-user AI preferences |
| `features/memory/brand-dna.service.ts` | Service | Builds Brand DNA snapshots |
| `features/memory/creator-dna.service.ts` | Service | Builds Creator DNA snapshots |
| `features/memory/relationship-dna.service.ts` | Service | Builds and updates Brand-Creator relationship intelligence |
| `features/memory/campaign-memory.service.ts` | Service | Inherits brand memory into new campaigns |
| `features/memory/memory.types.ts` | Types | Snapshot contracts for Brand DNA, Creator DNA, Relationship DNA, and Campaign Memory |
| `features/memory/memory.schemas.ts` | Validation | Zod schemas for extracted memory facts |
| `lib/core/config/memory.ts` | Config | Memory categories and limits |

### AI Learning Event Layer

| File | Category | Purpose |
| --- | --- | --- |
| `features/ai/ai-learning-event.repository.ts` | Repository | Appends raw learning events and normalized learning rows |
| `features/ai/ai-learning-worker.service.ts` | Worker | Processes pending AI events into memory facts |
| `features/ai/ai-learning-memory-writer.ts` | Writer | Writes campaign and creator memory facts derived from learning events |
| `features/ai/creator-matching-memory.service.ts` | Service | Resolves creator learning memory for matching behavior |
| `features/ai/ai-gateway.service.ts` | Gateway | Central AI provider boundary |
| `features/ai/ai-job.repository.ts` / `features/ai/ai-worker.service.ts` | Worker | AI job execution and retry lifecycle |
| `features/ai-copilot/**` | Copilot engine | QA retrieval, tool calls, user feedback, and Copilot learning |
| `features/ai-copilot/lucien-learning.service.ts` | Lucien learning | Every public + workspace Lucien turn writes `lucien_assistant_interaction`; feedback writes `lucien_assistant_feedback` |

### AI Copilot / StudioOS Brain Assets

AI customer support is not ordinary chat. It is a role-aware StudioOS Brain that must read the same database truth as the UI.

| Asset | Category | Purpose |
| --- | --- | --- |
| `components/ai-copilot/**` | UI shell | Brand / Creator / Admin AI assistant surfaces |
| `features/ai-support/**` | Service layer | AI support conversations, tool actions, and order conversion workflows |
| `features/communication/**` | Communication intelligence | Message localization, translation, and conversation context |
| `features/i18n/**` | Language intelligence | Shared language database service |
| `features/attribution/**` | Creative performance | Performance source and attribution evidence |
| `lib/studioos/creative-performance-store.ts` | Runtime store | JSON creative performance / insight store that must be migrated carefully |
| `lib/studioos/insight-engine.ts` | Insight engine | Creative performance insight generation |
| `lib/inquiry-chat-storage.ts` | Runtime store | Legacy inquiry chat storage that should migrate to DB + AIEvent |
| `lib/work-engagement-service.ts` | Runtime store | Existing work engagement / like data; must migrate toward Save Creator semantics |
| System reply library | Knowledge | Canonical answers, tone rules, and support content from `系统200条回复第一版.pdf` |
| AI inquiry learning | Learning source | Learns from brand brief questions, budget objections, creator refusal reasons, and match outcomes |

Protected rule: AI Copilot must not invent business facts. It should read Campaign, Payment, Review, Creator, Wallet, Learning, Brand DNA, Creator DNA, and AI Memory through service/repository layers.

### Language, Email, and Notification Intelligence

Language resources are also AI foundation assets because AI output, email templates, notifications, admin copy, and support replies must share the same translation truth.

| Asset | Category | Purpose |
| --- | --- | --- |
| LanguageKey / LanguageTranslation | Future database | Unified editable language database for UI, AI, email, notification, errors, and admin |
| Email templates | Communication asset | Lifecycle email copy for login, invitation, final selection, version upload, revision, approval, payout, arbitration |
| Notification templates | Communication asset | In-app lifecycle messages and action URLs |
| System reply templates | Support knowledge | 200-answer library and future multilingual support responses |

### Matching and Ranking Inputs

| File | Category | Purpose |
| --- | --- | --- |
| `features/matching/matching.service.ts` | Matching engine | Uses creator profile data, memory, and relationship DNA for creator ranking |
| `features/matching/campaign-selection.service.ts` | Learning source | Writes AI learning when brands select creators |
| `features/matching/invitation.service.ts` | Learning source | Writes AI learning from creator invitation responses |
| `features/matching/invitation-portal.service.ts` | Learning source | Writes preference learning for legacy invitation responses |
| `lib/studioos/ai-matching-policy.ts` | Policy | Matching policy copy / controls |
| `lib/matching-engine.ts` | Legacy matching | Existing matching logic that may be migrated, not deleted blindly |
| `lib/studioos/ai-match-report-statistics.ts` | Reporting | Reads campaign memory and AI learning rows for match reports |

### Creator Preference and Pricing Signals

| File | Category | Purpose |
| --- | --- | --- |
| `components/studioos/creator-pricing-preference-card.tsx` | UI signal | Creator budget preference input |
| `app/studio-settings-actions.ts` | Action | Updates creator pricing preference |
| `lib/studioos/creator-settings-service.ts` | Service | Persists creator settings and budget preference |
| `lib/studioos/creator-price-preference.ts` | Utility | Normalizes creator minimum budget |
| `lib/studioos/creator-ai-match-health.ts` | Insight | Explains AI match health and budget-related preference prompts |

### Creative DNA Assets

| File | Category | Purpose |
| --- | --- | --- |
| `lib/studioos/creative-dna.ts` | DNA model | Creative DNA types and helpers |
| `lib/studioos/creative-dna-service.ts` | Service | Creative DNA calculations and storage bridge |

## Current Learning Sources

| Behavior | Current Source | Learning Target |
| --- | --- | --- |
| AI creative direction selected | `features/ai/creative-direction.service.ts` | Campaign memory |
| AI creative collaboration draft clicked / generated / selected / deepened / sent / confirmed | Future `features/creative-collaboration/**` or `features/ai/**` | Brand AI Taste, Creator Creative DNA, Campaign memory |
| Creator declines invitation | `features/matching/invitation.service.ts` / `invitation-portal.service.ts` | Creator and Campaign memory |
| Brand selects creator | `features/matching/campaign-selection.service.ts` | Campaign selection memory |
| Successful collaboration | `features/memory/relationship-dna.service.ts` | Relationship DNA |
| Communication style / language | `features/memory/ai-preference.service.ts` | User AI preference |
| Connected channel enabled | `features/channels/connected-channel.service.ts` | Future creator data learning input |
| AI support conversation | `features/ai-support/**` | Future AI support memory and product friction learning |
| Lucien assistant interaction (public + workspace) | `features/ai-copilot/lucien-learning.service.ts` | `AIEvent` + `AILearning` (`lucien_assistant_interaction`) |
| Lucien assistant feedback (workspace thumbs) | `features/ai-copilot/lucien-learning.service.ts` | `AILearning` (`lucien_assistant_feedback`) + `MemoryFact` |
| Lucien boundary refusal | `features/ai-copilot/lucien-boundary.service.ts` | `AILearning` (`lucien_knowledge_boundary_audit`, `lucien_assistant_interaction`) |
| Translation / localization failure | `features/communication/**` | Future language quality learning |

## Future Learning Sources

These should be added gradually through `AIEvent` / `AILearning`, not as isolated feature tables.

| Behavior | Event Type | Notes |
| --- | --- | --- |
| View Creator Profile | `view_creator` | Low weight, behavior signal |
| View Portfolio | `view_portfolio` | Stronger style signal |
| Save Creator | `save_creator` | Must be called Save Creator, not Like |
| Contact Creator | `contact_creator` | Intent signal |
| Invite Creator | `invite_creator` | Strong intent signal |
| Creator Accepts Invitation | `CreatorAccepted` | Creator interest signal, not project creation |
| Hire Creator | `hire_creator` | Highest positive signal |
| Quick Exit | `quick_exit` | Negative preference signal |
| Declined Invite | `declined_invite` | Negative / mismatch signal |
| Report Portfolio | `report_portfolio` | Strong negative signal |
| Budget Too Low | `creator_decline_budget_low` | Pricing intelligence and budget health |
| Schedule Conflict | `creator_decline_schedule_conflict` | Availability intelligence |
| Unclear Brief | `creator_decline_unclear_brief` | Brief quality learning |
| Brand Chooses Non-AI Recommendation | `brand_override_ai_recommendation` | Ranking correction signal |
| Brand Viewed Creator Profile | `BrandViewedCreatorProfile` | Brand shortlist interest signal |
| Brand Requested Creator Reroll | `BrandRequestedCreatorReroll` | Matching correction / dissatisfaction signal |
| Brand Refund Option Shown | `BrandRefundOptionShown` | No suitable creator / refund-available signal |
| Brand AI Idea Clicked | `brand_ai_idea_clicked` | Explicit post-payment token trigger |
| Brand AI Idea Generated | `brand_ai_idea_generated` | Brand creative preference signal |
| Brand AI Idea Selected | `brand_ai_idea_selected` | Positive creative direction preference |
| Brand AI Idea Deepened | `brand_ai_idea_deepened` | Stronger creative intent signal |
| Brand AI Idea Sent to Creator | `brand_ai_idea_sent_to_creator` | Collaboration draft handoff |
| Brand AI Idea Skipped | `brand_ai_idea_skipped` | Negative / no-fit creative signal |
| Creator AI Idea Clicked | `creator_ai_idea_clicked` | Creator-side explicit token trigger |
| Creator AI Idea Generated | `creator_ai_idea_generated` | Creator derivative ideation signal |
| Creator AI Idea Selected | `creator_ai_idea_selected` | Creator creative preference signal |
| Creator Idea Sent to Brand | `creator_idea_sent_to_brand` | Creator-to-brand proposal signal |
| Brand Confirmed Creator Idea | `brand_confirmed_creator_idea` | Positive collaboration / creative fit signal |
| Brand Rejected Creator Idea | `brand_rejected_creator_idea` | Negative collaboration / creative fit signal |
| Brand Deepened Creator Idea | `brand_deepened_creator_idea` | Brand correction over creator direction |
| Final Creative Direction Confirmed | `final_creative_direction_confirmed` | Final creative intent and future ranking evidence |
| AI Support Question | `ai_support_question` | Product friction and knowledge gap signal |
| Translation Failure | `translation_failed` | Localization quality signal |

## Cleanup and Migration Rules

Before deleting or replacing any AI learning asset:

1. Identify all data it owns.
2. Identify all writers.
3. Identify all readers.
4. Provide a migration path for historical data.
5. Preserve event history and derived memory where possible.
6. Update `docs/AI_LEARNING_FOUNDATION.md`.
7. Update `docs/AI_PREFERENCE_ENGINE.md` if preference behavior changes.
8. Run memory verification:

```bash
npm run memory:verify
npm run membership:verify
```

## Explicitly Protected From Zombie Cleanup

The following categories are protected even if current UI usage appears partial:

- `AiPreference`
- `MemoryFact`
- `RelationshipDna`
- `AIEvent`
- `AILearning`
- `AiJob`
- `features/memory/**`
- `features/ai/ai-learning-*`
- `features/ai/creator-matching-memory.service.ts`
- `lib/core/config/memory.ts`
- `lib/studioos/creative-dna*`
- `lib/studioos/ai-match-report-statistics.ts`
- `lib/studioos/ai-matching-policy.ts`
- `features/ai-support/**`
- `features/ai-copilot/**`
- `features/i18n/**`
- `features/communication/**`
- `features/attribution/**`
- `components/ai-copilot/**`
- `lib/studioos/creative-performance-store.ts`
- `lib/studioos/insight-engine.ts`
- `lib/inquiry-chat-storage.ts`
- `lib/work-engagement-service.ts`
- AI support system reply libraries
- Language database / translation keys
- Email and notification template knowledge

These are foundation assets for AI Preference Engine, Brand AI Taste, Creator Matching, and long-term platform intelligence.

## Known Architecture Risks

- `lib/studioos/ai-matching-policy.ts` currently uses compiled runtime weights. This conflicts with the long-term AI Preference Engine rule that learning and ranking weights should move into configurable `ai_learning_rules` / AI weight tables. Treat the current file as a protected migration target, not a permanent source of truth.
- `ai-learning-worker.service.ts` currently processes only `CreatorRejected`. Other written events such as brand creator selection and future Save Creator signals need worker support before they become true memory.
- `lib/work-engagement-service.ts` uses work-like semantics. Future creator preference work must migrate this toward `Save Creator` and AI Learning Events.
- `lib/inquiry-chat-storage.ts` keeps inquiry chat outside the main database path. AI inquiry learning should migrate these conversations into DB-backed event/memory flows.
- `scripts/purge-runtime-data.ts` can delete AI memory, learning, Copilot, and conversation data. Runtime purge is not zombie cleanup and must be owner-authorized.
