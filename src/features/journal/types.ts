import { type JSONContent } from '@tiptap/core';

export const JournalStatus = {
    Draft: 0,
    Published: 1,
} as const;

export type JournalStatus = typeof JournalStatus[keyof typeof JournalStatus];

export interface JournalEntry {
    id: string;
    title: string;
    contentJson: JSONContent; // Tiptap JSON 內自然包含 {"type": "image", "attrs": {"src": "..."}}
    contentHtml: string;      // HTML 內自然包含 <img src="..." />
    tags?: string[];
    status: JournalStatus;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateJournalDto {
    title: string;
    contentJson: string;
    contentHtml: string;
    tags?: string;
    status: JournalStatus;
}