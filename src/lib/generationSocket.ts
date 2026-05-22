import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '@/config/api';
import { getToken } from './auth';
import { logger } from './logger';

/**
 * Backend STOMP payload sent to `/topic/generation/{taskId}` when an async
 * timetable generation finishes. Mirrors `GenerationStatusResponse` (core-api).
 */
export interface GenerationStatusMessage {
  taskId: string;
  status: 'SUCCESS' | 'ERROR' | 'PROCESSING';
  message: string;
  /** Present only on SUCCESS — the id of the freshly generated timetable. */
  timetableId: string | null;
}

export type GenerationHandler = (msg: GenerationStatusMessage) => void;

interface Watcher {
  destination: string;
  handler: GenerationHandler;
  sub?: StompSubscription;
}

/**
 * Single shared STOMP connection over SockJS (`/ws`). The backend endpoint is
 * registered with `.withSockJS()`, so a raw WebSocket will NOT handshake — we
 * must go through SockJS.
 *
 * Lifecycle: lazily activated on the first {@link watchGeneration} call and then
 * kept alive (with auto-reconnect) for the rest of the session. Watchers are
 * re-subscribed automatically after a reconnect.
 */
class GenerationSocket {
  private client: Client | null = null;
  private readonly watchers = new Set<Watcher>();

  private ensureClient(): Client {
    if (this.client) return this.client;

    const wsUrl = `${API_CONFIG.BASE_URL}/ws`;

    this.client = new Client({
      // SockJS factory — required because the server endpoint uses withSockJS().
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // Token is optional today (server doesn't enforce STOMP auth) but we send
      // it for forward-compat; refreshed on every (re)connect.
      beforeConnect: () => {
        const token = getToken();
        this.client!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
      onConnect: () => {
        logger.info('[generationSocket] connected');
        // (Re)subscribe every active watcher — covers the post-reconnect case.
        this.watchers.forEach((w) => this.subscribe(w));
      },
      onStompError: (frame) => {
        logger.error('[generationSocket] STOMP error', frame.headers['message'], frame.body);
      },
      onWebSocketError: (evt) => {
        logger.error('[generationSocket] WebSocket error', evt);
      },
      debug: () => {},
    });

    this.client.activate();
    return this.client;
  }

  private subscribe(watcher: Watcher): void {
    if (!this.client?.connected) return;
    watcher.sub = this.client.subscribe(watcher.destination, (frame: IMessage) => {
      try {
        const msg = JSON.parse(frame.body) as GenerationStatusMessage;
        watcher.handler(msg);
      } catch (err) {
        logger.error('[generationSocket] failed to parse message', err, frame.body);
      }
    });
  }

  /**
   * Watch a single generation task. The handler fires when the backend reports
   * SUCCESS or ERROR for `taskId`. Returns an unsubscribe function — call it once
   * you've handled the terminal event (the handler does NOT auto-unsubscribe).
   */
  watchGeneration(taskId: string, handler: GenerationHandler): () => void {
    const watcher: Watcher = { destination: `/topic/generation/${taskId}`, handler };
    this.watchers.add(watcher);

    const client = this.ensureClient();
    if (client.connected) {
      this.subscribe(watcher);
    }
    // else: onConnect will subscribe it once the socket comes up.

    return () => {
      watcher.sub?.unsubscribe();
      this.watchers.delete(watcher);
    };
  }
}

export const generationSocket = new GenerationSocket();
