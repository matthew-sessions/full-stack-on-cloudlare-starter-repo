import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecentClicks, deleteClicksBefore } from '@/helpers/durable-queries';
import { LinkClickTracker } from '@/durable-objects/link-click-tracker';

vi.mock('@/helpers/durable-queries', () => ({
	getRecentClicks: vi.fn(),
	deleteClicksBefore: vi.fn(),
}));

vi.mock('cloudflare:workers', () => ({
	DurableObject: class MockDurableObject {
		ctx: any;
		env: any;
		constructor(ctx: any, env: any) {
			this.ctx = ctx;
			this.env = env;
		}
	},
}));

class MockSqlStorage {
	exec = vi.fn();
	databaseSize = 0;
	Cursor = vi.fn();
	Statement = vi.fn();
}

class MockWebSocket {
	send = vi.fn();
	close = vi.fn();
	addEventListener = vi.fn();
	removeEventListener = vi.fn();
	dispatchEvent = vi.fn();
	readyState = 1;
	url = '';
	protocol = '';
	extensions = '';
	bufferedAmount = 0;
	binaryType = 'blob' as 'blob' | 'arraybuffer';
	onopen = null;
	onmessage = null;
	onclose = null;
	onerror = null;
	accept = vi.fn();
	serializeAttachment = vi.fn();
	deserializeAttachment = vi.fn();
}

class MockDurableObjectState {
	storage = {
		sql: new MockSqlStorage(),
		get: vi.fn(),
		put: vi.fn(),
		getAlarm: vi.fn(),
		setAlarm: vi.fn(),
	};
	getWebSockets = vi.fn();
	acceptWebSocket = vi.fn();
	blockConcurrencyWhile = vi.fn((fn: () => Promise<void>) => fn());
}

// Mock WebSocketPair and Response for Cloudflare Workers environment
(global as any).WebSocketPair = vi.fn().mockImplementation(() => {
	const client = new MockWebSocket();
	const server = new MockWebSocket();
	return { 0: client, 1: server };
});

// Mock the global Response to handle webSocket option
const OriginalResponse = global.Response;
global.Response = vi.fn().mockImplementation((body, init) => {
	if (init?.webSocket) {
		return {
			status: init.status || 200,
			webSocket: init.webSocket,
		};
	}
	return new OriginalResponse(body, init);
}) as any;

vi.mock('moment', () => ({
	default: vi.fn(() => ({
		add: vi.fn().mockReturnThis(),
		valueOf: vi.fn(() => 1640995300000), // 2 seconds after base time
	})),
}));

describe('LinkClickTracker Business Logic', () => {
	let mockCtx: MockDurableObjectState;
	let tracker: LinkClickTracker;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockCtx = new MockDurableObjectState();
		mockCtx.storage.get.mockResolvedValue(0);
		tracker = new LinkClickTracker(mockCtx as any, {} as any);
	});

	describe('addClick', () => {
		it('should insert click data into database', async () => {
			mockCtx.storage.getAlarm.mockResolvedValue(123456789);

			await tracker.addClick(40.7128, -74.006, 'US', 1640995200000);

			expect(mockCtx.storage.sql.exec).toHaveBeenCalledWith(
				expect.stringContaining('INSERT INTO geo_link_clicks'),
				40.7128,
				-74.006,
				'US',
				1640995200000,
			);
		});

		it('should set alarm if none exists', async () => {
			mockCtx.storage.getAlarm.mockResolvedValue(null);

			await tracker.addClick(40.7128, -74.006, 'US', 1640995200000);

			expect(mockCtx.storage.getAlarm).toHaveBeenCalled();
			expect(mockCtx.storage.setAlarm).toHaveBeenCalledWith(1640995300000);
		});

		it('should not set alarm if one already exists', async () => {
			mockCtx.storage.getAlarm.mockResolvedValue(123456789);

			await tracker.addClick(40.7128, -74.006, 'US', 1640995200000);

			expect(mockCtx.storage.getAlarm).toHaveBeenCalled();
			expect(mockCtx.storage.setAlarm).not.toHaveBeenCalled();
		});
	});

	describe('alarm', () => {
		it('should get recent clicks and send to websockets', async () => {
			const mockClickData = {
				clicks: [{ latitude: 40.7128, longitude: -74.006, country: 'US', time: 1640995200000 }],
				mostRecentTime: 1640995250000,
				oldestTime: 1640995100000,
			};

			vi.mocked(getRecentClicks).mockReturnValue(mockClickData);

			const mockSocket1 = new MockWebSocket();
			const mockSocket2 = new MockWebSocket();
			mockCtx.getWebSockets.mockReturnValue([mockSocket1, mockSocket2]);

			const flushSpy = vi.spyOn(tracker, 'flushOffsetTimes').mockResolvedValue();

			await tracker.alarm();

			expect(getRecentClicks).toHaveBeenCalledWith(mockCtx.storage.sql, 0);
			expect(mockSocket1.send).toHaveBeenCalledWith(JSON.stringify(mockClickData.clicks));
			expect(mockSocket2.send).toHaveBeenCalledWith(JSON.stringify(mockClickData.clicks));
			expect(flushSpy).toHaveBeenCalledWith(1640995250000, 1640995100000);
			expect(deleteClicksBefore).toHaveBeenCalledWith(mockCtx.storage.sql, 1640995100000);
		});

		it('should handle empty clicks data', async () => {
			const mockClickData = {
				clicks: [],
				mostRecentTime: 0,
				oldestTime: 0,
			};

			vi.mocked(getRecentClicks).mockReturnValue(mockClickData);
			mockCtx.getWebSockets.mockReturnValue([]);

			const flushSpy = vi.spyOn(tracker, 'flushOffsetTimes').mockResolvedValue();

			await tracker.alarm();

			expect(getRecentClicks).toHaveBeenCalledWith(mockCtx.storage.sql, 0);
			expect(flushSpy).toHaveBeenCalledWith(0, 0);
			expect(deleteClicksBefore).toHaveBeenCalledWith(mockCtx.storage.sql, 0);
		});

		it('should use current mostRecentOffsetTime for getRecentClicks', async () => {
			tracker.mostRecentOffsetTime = 1640995150000;

			const mockClickData = {
				clicks: [{ latitude: 40.7128, longitude: -74.006, country: 'US', time: 1640995200000 }],
				mostRecentTime: 1640995250000,
				oldestTime: 1640995150000,
			};

			vi.mocked(getRecentClicks).mockReturnValue(mockClickData);
			mockCtx.getWebSockets.mockReturnValue([]);

			const flushSpy = vi.spyOn(tracker, 'flushOffsetTimes').mockResolvedValue();

			await tracker.alarm();

			expect(getRecentClicks).toHaveBeenCalledWith(mockCtx.storage.sql, 1640995150000);
		});
	});

	describe('flushOffsetTimes', () => {
		it('should update instance variables and persist to storage', async () => {
			await tracker.flushOffsetTimes(1640995250000, 1640995100000);

			expect(tracker.mostRecentOffsetTime).toBe(1640995250000);
			expect(tracker.leastRecentOffsetTime).toBe(1640995100000);
			expect(mockCtx.storage.put).toHaveBeenCalledWith('mostRecentOffsetTime', 1640995250000);
			expect(mockCtx.storage.put).toHaveBeenCalledWith('leastRecentOffsetTime', 1640995100000);
		});

		it('should handle zero values', async () => {
			await tracker.flushOffsetTimes(0, 0);

			expect(tracker.mostRecentOffsetTime).toBe(0);
			expect(tracker.leastRecentOffsetTime).toBe(0);
			expect(mockCtx.storage.put).toHaveBeenCalledWith('mostRecentOffsetTime', 0);
			expect(mockCtx.storage.put).toHaveBeenCalledWith('leastRecentOffsetTime', 0);
		});
	});

	describe('fetch', () => {
		it('should create WebSocket pair and return proper response', async () => {
			const mockRequest = new Request('http://localhost');
			const response = await tracker.fetch(mockRequest);

			expect(mockCtx.acceptWebSocket).toHaveBeenCalled();
			expect(response.status).toBe(101);
			expect(response.webSocket).toBeInstanceOf(MockWebSocket);
		});
	});

	describe('webSocketClose', () => {
		it('should log when websocket closes', () => {
			const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			const mockWebSocket = new MockWebSocket();

			tracker.webSocketClose(mockWebSocket, 1000, 'Normal closure', true);

			expect(consoleSpy).toHaveBeenCalledWith('client closed');
			consoleSpy.mockRestore();
		});
	});
});
