import type { GiveawayFilters, Participant } from './giveaway';
export interface Giveaway { id: string; name: string; source_type: 'MANUAL_IMPORT' | 'META_OFFICIAL' | 'EXTERNAL_PROVIDER'; status: 'draft'|'ready'|'completed'|'archived'; participant_count: number; created_at: string; filters: GiveawayFilters; source: { url?: string; media?: Media; listId?: string }; }
export interface Media { id: string; caption?: string; permalink: string; media_type?: string; thumbnail_url?: string; media_url?: string; comments_count?: number; timestamp?: string; username?: string }
export interface List { id: string; name: string; type: string; valid_rows: number; total_rows: number; created_at: string }
export interface Winner { id: string; username: string; position: number; is_reserve: boolean; comment_text: string|null; participant_entry_id: string }
export interface Draw { id: string; giveaway_id: string; sequence_number: number; eligible_count: number; participant_pool_hash: string; random_method: string; created_at: string; winners: Winner[]; filters_snapshot: GiveawayFilters; public: boolean; }
export interface GiveawayDetail { giveaway: Giveaway; draws: Draw[]; total: number; participants: Participant[] }
export interface Settings { appName: string; winnerCount: number; animationDuration: number; theme: 'light'|'dark'|'system'; language: 'uz'; filters: GiveawayFilters }
