import { Container } from '@n8n/di';

import { TagRepository } from '@/databases/repositories/tag.repository';

import { createUserShell } from './shared/db/users';
import * as testDb from './shared/test-db';
import type { SuperAgentTest } from './shared/types';
import * as utils from './shared/utils/';

let authOwnerAgent: SuperAgentTest;
const testServer = utils.setupTestServer({ endpointGroups: ['tags'] });

beforeAll(async () => {
	const ownerShell = await createUserShell('global:owner');
	authOwnerAgent = testServer.authAgentFor(ownerShell);
});

beforeEach(async () => {
	await testDb.truncate(['Tag']);
});

describe('POST /tags', () => {
	test('should create tag', async () => {
		const resp = await authOwnerAgent.post('/tags').send({ name: 'test' });
		expect(resp.statusCode).toBe(200);

		const dbTag = await Container.get(TagRepository).findBy({ name: 'test' });
		expect(dbTag.length === 1);
	});

	test('should not create duplicate tag', async () => {
		const newTag = Container.get(TagRepository).create({ name: 'test' });
		await Container.get(TagRepository).save(newTag);

		const resp = await authOwnerAgent.post('/tags').send({ name: 'test' });
		expect(resp.status).toBe(500);

		const dbTag = await Container.get(TagRepository).findBy({ name: 'test' });
		expect(dbTag.length).toBe(1);
	});
});
