import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '@/config/api';
import { getToken } from './auth';
import { logger } from './logger';

/** One pre-flight diagnostic issue. Mirrors `PreflightReportDto.Issue` (core-api). */
export interface PreflightIssue {
  code: string | null;
  severity: 'CRITICAL' | 'WARNING' | string;
  message: string;
  resourceType: string | null; // "CLASS" | "TEACHER" | "ROOM" | "SYNC" | "GLOBAL"
  resourceId: number | null;
  resourceName: string | null;
  metric: number;
  threshold: number;
  suggestions: string[];
}

/**
 * Structured pre-flight report. Mirrors `PreflightReportDto` (core-api).
 * `issues` is already ordered CRITICAL-first by the backend.
 */
export interface PreflightReport {
  criticalCount: number;
  warningCount: number;
  issues: PreflightIssue[];
}

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
  /** Present only when an ERROR is caused by pre-flight rejection. */
  preflight?: PreflightReport | null;
}

export type GenerationHandler = (msg: GenerationStatusMessage) => void;

interface Subscription {
  destination: string;
  handler: GenerationHandler;
  sub?: StompSubscription;
}

/**
 * Single shared STOMP connection over SockJS (`/ws`). The backend endpoint is
 * registered with `.withSockJS()`, so a raw WebSocket will NOT handshake — we
 * must go through SockJS.
 *
 * Lifecycle: {@link connect} is called eagerly (on login, by GenerationProvider)
 * so the socket is connected and subscribed to the org topic BEFORE any
 * generation can finish — this avoids the race where a fast-failing job (e.g.
 * pre-flight rejection) publishes before the client subscribes (SimpleBroker
 * drops messages for topics with no subscriber). Subscriptions are
 * re-established automatically after a reconnect.
 */
class GenerationSocket {
  private client: Client | null = null;
  private readonly subscriptions = new Set<Subscription>();

  /** Eagerly open the connection. Idempotent. */
  connect(): void {
    this.ensureClient();
  }

  private ensureClient(): Client {
    if (this.client) return this.client;

    const wsUrl = `${API_CONFIG.BASE_URL}/ws`;

    this.client = new Client({
      // SockJS factory — required because the server endpoint uses withSockJS().
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // STOMP CONNECT is JWT-authenticated server-side; refresh the token on
      // every (re)connect.
      beforeConnect: () => {
        const token = getToken();
        this.client!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },
      onConnect: () => {
        logger.info('[generationSocket] connected');
        // (Re)subscribe everything — covers the post-reconnect case.
        this.subscriptions.forEach((s) => this.openSubscription(s));
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

  private openSubscription(s: Subscription): void {
    if (!this.client?.connected) return;
    s.sub = this.client.subscribe(s.destination, (frame: IMessage) => {
      try {
        const msg = JSON.parse(frame.body) as GenerationStatusMessage;
        s.handler(msg);
      } catch (err) {
        logger.error('[generationSocket] failed to parse message', err, frame.body);
      }
    });
  }

  /**
   * Subscribe to a STOMP destination. Returns an unsubscribe function. Safe to
   * call before the socket is connected — it will be opened on connect.
   */
  subscribe(destination: string, handler: GenerationHandler): () => void {
    const s: Subscription = { destination, handler };
    this.subscriptions.add(s);

    const client = this.ensureClient();
    if (client.connected) {
      this.openSubscription(s);
    }

    return () => {
      s.sub?.unsubscribe();
      this.subscriptions.delete(s);
    };
  }
}

export const generationSocket = new GenerationSocket();
