import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLinkClick } from '@/queue-handlers/link-clicks';
import { addLinkClick } from '@repo/data-ops/queries/links';
import { scheduleEvalWorkflow } from '@/helpers/route-ops';
import type { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';

vi.mock('@repo/data-ops/queries/links', () => ({
	addLinkClick: vi.fn()
}));

vi.mock('@/helpers/route-ops', () => ({
	scheduleEvalWorkflow: vi.fn()
}));

describe('handleLinkClick', () => {
	const mockEnv = {} as Env;
	
	const mockEvent: LinkClickMessageType = {
		type: 'LINK_CLICK',
		data: {
			timestamp: '2024-01-01T00:00:00Z',
			id: 'test-link-id',
			accountId: 'test-account-id',
			destination: 'https://example.com',
			country: 'US',
			latitude: 40.7128,
			longitude: -74.0060
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call addLinkClick with event data', async () => {
		await handleLinkClick(mockEnv, mockEvent);

		expect(addLinkClick).toHaveBeenCalledWith(mockEvent.data);
	});

	it('should call scheduleEvalWorkflow with env and event', async () => {
		await handleLinkClick(mockEnv, mockEvent);

		expect(scheduleEvalWorkflow).toHaveBeenCalledWith(mockEnv, mockEvent);
	});

	it('should call both functions in sequence', async () => {
		const addLinkClickMock = vi.mocked(addLinkClick);
		const scheduleEvalWorkflowMock = vi.mocked(scheduleEvalWorkflow);

		await handleLinkClick(mockEnv, mockEvent);

		expect(addLinkClickMock).toHaveBeenCalledBefore(scheduleEvalWorkflowMock);
	});

	it('should handle event without optional fields', async () => {
		const eventWithoutOptionals: LinkClickMessageType = {
			type: 'LINK_CLICK',
			data: {
				timestamp: '2024-01-01T00:00:00Z',
				id: 'test-link-id',
				accountId: 'test-account-id',
				destination: 'https://example.com'
			}
		};

		await handleLinkClick(mockEnv, eventWithoutOptionals);

		expect(addLinkClick).toHaveBeenCalledWith(eventWithoutOptionals.data);
		expect(scheduleEvalWorkflow).toHaveBeenCalledWith(mockEnv, eventWithoutOptionals);
	});

	it('should handle errors from addLinkClick gracefully', async () => {
		const addLinkClickMock = vi.mocked(addLinkClick);
		addLinkClickMock.mockRejectedValueOnce(new Error('Database error'));

		await expect(handleLinkClick(mockEnv, mockEvent)).rejects.toThrow('Database error');
		expect(scheduleEvalWorkflow).not.toHaveBeenCalled();
	});

	it('should handle errors from scheduleEvalWorkflow gracefully', async () => {
		const scheduleEvalWorkflowMock = vi.mocked(scheduleEvalWorkflow);
		scheduleEvalWorkflowMock.mockRejectedValueOnce(new Error('Workflow error'));

		await expect(handleLinkClick(mockEnv, mockEvent)).rejects.toThrow('Workflow error');
		expect(addLinkClick).toHaveBeenCalledWith(mockEvent.data);
	});
});