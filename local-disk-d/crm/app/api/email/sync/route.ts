// @ts-nocheck
import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_EMAILS_PER_SYNC = 20;

// Prevent concurrent syncs
let syncInProgress = false;

export async function POST(req: Request) {
    if (syncInProgress) {
        return NextResponse.json({ success: true, count: 0, message: 'Sync already in progress' }, { status: 200 });
    }
    syncInProgress = true;

    const url = new URL(req.url);
    const clearAll = url.searchParams.get('clearAll') === 'true';

    let client: any = null;

    const cleanup = async () => {
        syncInProgress = false;
        if (client) {
            try { client.close(); } catch (_) {}
        }
    };

    try {
        client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: process.env.SMTP_USER || 'mrperfect9863@gmail.com',
                pass: process.env.SMTP_PASS || 'qusb wqwj rdap clsi'
            },
            logger: false,
            socketTimeout: 45000,
            greetingTimeout: 10000,
            emitLogs: false,
        });

        // Catch socket-level errors so they don't become uncaughtExceptions
        client.on('error', (err: any) => {
            console.error('IMAP client error (handled):', err.code || err.message);
        });

        await client.connect();
        await client.mailboxOpen('INBOX');

        // --- CLEAR ALL MODE ---
        if (clearAll) {
            const allUnseen = await client.search({ seen: false }, { uid: true });
            if (allUnseen && allUnseen.length > 0) {
                console.log(`Marking ${allUnseen.length} emails as read...`);
                await client.messageFlagsAdd(allUnseen, ['\\Seen'], { uid: true });
                console.log(`Done — marked ${allUnseen.length} as read.`);
            }
            await client.logout();
            await cleanup();
            return NextResponse.json({ success: true, markedRead: allUnseen?.length || 0 });
        }

        // --- PRE-FETCH facility emails in ONE query ---
        const { data: facilities } = await supabase
            .from('srimatric')
            .select('id, email')
            .not('email', 'is', null);

        const facilityByEmail = new Map<string, number>();
        for (const f of facilities || []) {
            if (f.email) facilityByEmail.set(f.email.toLowerCase(), f.id);
        }

        // Pre-fetch sent message IDs for reply detection
        const { data: sentMessages } = await supabase
            .from('facility_interactions')
            .select('email_message_id')
            .not('email_message_id', 'is', null);

        const sentMessageIds = new Set<string>();
        for (const m of sentMessages || []) {
            if (m.email_message_id) sentMessageIds.add(m.email_message_id);
        }

        // Search UNSEEN from last 7 days
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const unseenUids = await client.search({ seen: false, since }, { uid: true });

        if (!unseenUids || unseenUids.length === 0) {
            await client.logout();
            await cleanup();
            return NextResponse.json({ success: true, count: 0, checked: 0 });
        }

        const uidsToProcess = unseenUids.slice(-MAX_EMAILS_PER_SYNC);
        console.log(`Sync: ${unseenUids.length} unseen, processing ${uidsToProcess.length}`);

        // --- PASS 1: envelope-only filter (fast, no body) ---
        const candidateUids: number[] = [];
        const envelopeMap = new Map();
        const nonMatchUids: number[] = [];

        for await (const msg of client.fetch(uidsToProcess, { envelope: true, flags: true }, { uid: true })) {
            const from = msg.envelope?.from?.[0]?.address?.toLowerCase();
            const toList = msg.envelope?.to?.map((t: any) => t.address?.toLowerCase()).filter(Boolean) || [];

            const fromMatch = from && facilityByEmail.has(from);
            const toMatch = toList.some((t: string) => facilityByEmail.has(t));

            if (fromMatch || toMatch) {
                candidateUids.push(msg.uid);
                envelopeMap.set(msg.uid, { from, toList, fromMatch, toMatch });
            } else {
                nonMatchUids.push(msg.uid);
            }
        }

        // Bulk mark non-matches as read
        if (nonMatchUids.length > 0) {
            await client.messageFlagsAdd(nonMatchUids, ['\\Seen'], { uid: true });
        }

        if (candidateUids.length === 0) {
            await client.logout();
            await cleanup();
            return NextResponse.json({ success: true, count: 0, checked: uidsToProcess.length });
        }

        console.log(`${candidateUids.length} matched, downloading bodies...`);

        // --- PASS 2: download body ONLY for matched emails ---
        const interactionsToInsert: any[] = [];

        for await (const msg of client.fetch(candidateUids, { source: true }, { uid: true })) {
            try {
                const parsed = await simpleParser(msg.source);
                const env = envelopeMap.get(msg.uid);
                const subject = parsed.subject || 'No Subject';
                const text = parsed.text || '';
                const inReplyTo = parsed.inReplyTo || null;
                const refs = parsed.references || [];

                if (env.fromMatch) {
                    const facilityId = facilityByEmail.get(env.from);
                    let isReply = false;
                    if (inReplyTo && sentMessageIds.has(inReplyTo)) isReply = true;
                    if (!isReply) {
                        const refList = Array.isArray(refs) ? refs : [refs];
                        for (const r of refList) {
                            if (sentMessageIds.has(r)) { isReply = true; break; }
                        }
                    }
                    interactionsToInsert.push({
                        facility_id: facilityId,
                        interaction_type: isReply ? 'Email (Replied)' : 'Email (Received)',
                        subject, body: text,
                        outcome: isReply ? 'Replied' : 'Received',
                        email_message_id: parsed.messageId || null,
                        created_at: parsed.date ? parsed.date.toISOString() : new Date().toISOString()
                    });
                } else if (env.toMatch) {
                    for (const toAddr of env.toList) {
                        const facilityId = facilityByEmail.get(toAddr);
                        if (facilityId) {
                            interactionsToInsert.push({
                                facility_id: facilityId,
                                interaction_type: 'Email (Sent)',
                                subject, body: text, outcome: 'Sent',
                                email_message_id: parsed.messageId || null,
                                created_at: parsed.date ? parsed.date.toISOString() : new Date().toISOString()
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Parse error:', err);
            }
        }

        // Bulk mark matched as read
        await client.messageFlagsAdd(candidateUids, ['\\Seen'], { uid: true });

        // --- BATCH INSERT ---
        if (interactionsToInsert.length > 0) {
            const { error } = await supabase.from('facility_interactions').insert(interactionsToInsert);
            if (error) console.error('Batch insert error:', error);
            else console.log(`Inserted ${interactionsToInsert.length} interactions`);
        }

        await client.logout();
        await cleanup();
        return NextResponse.json({
            success: true,
            count: interactionsToInsert.length,
            checked: uidsToProcess.length,
            matched: candidateUids.length
        });
    } catch (err: any) {
        console.error('Sync error:', err.code || err.message);
        await cleanup();
        return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
    }
}
