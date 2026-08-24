import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, '../../firebase/storage.rules');

let testEnv: RulesTestEnvironment;
const USER_A = 'storage-user-a';
const USER_B = 'storage-user-b';
const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
const putFile = (ref: firebase.storage.Reference, data: Uint8Array, metadata: firebase.storage.UploadMetadata) => new Promise((resolve, reject) => {
  const task = ref.put(data, metadata);
  task.on('state_changed', undefined, reject, () => resolve(undefined));
});

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-your-closet',
    storage: { rules: readFileSync(RULES_PATH, 'utf8') },
  });
});

afterEach(async () => { await testEnv.clearStorage(); });
afterAll(async () => { await testEnv.cleanup(); });

describe('Storage ownership and upload constraints', () => {
  test('owner can write, read metadata, and delete a wardrobe image', async () => {
    const owner = testEnv.authenticatedContext(USER_A, { firebase: { sign_in_provider: 'phone' } });
    const file = owner.storage().ref(`users/${USER_A}/clothes/item-1234567890.jpg`);
    await assertSucceeds(putFile(file, jpeg, { contentType: 'image/jpeg' }));
    await assertSucceeds(file.getMetadata());
    await assertSucceeds(file.delete());
  });

  test('another user cannot read, overwrite, or delete the owner image', async () => {
    const owner = testEnv.authenticatedContext(USER_A, { firebase: { sign_in_provider: 'phone' } });
    const other = testEnv.authenticatedContext(USER_B, { firebase: { sign_in_provider: 'phone' } });
    const path = `users/${USER_A}/clothes/item-2234567890.jpg`;
    await assertSucceeds(putFile(owner.storage().ref(path), jpeg, { contentType: 'image/jpeg' }));
    await assertFails(other.storage().ref(path).getMetadata());
    await assertFails(putFile(other.storage().ref(path), jpeg, { contentType: 'image/jpeg' }));
    await assertFails(other.storage().ref(path).delete());
  });

  test('owner cannot write an unsupported MIME type or oversized object', async () => {
    const owner = testEnv.authenticatedContext(USER_A, { firebase: { sign_in_provider: 'phone' } });
    await assertFails(putFile(owner.storage().ref(`users/${USER_A}/clothes/not-image.jpg`), new Uint8Array([1, 2, 3]), { contentType: 'text/plain' }));
    const oversized = new Uint8Array(10 * 1024 * 1024);
    await assertFails(putFile(owner.storage().ref(`users/${USER_A}/clothes/too-large.jpg`), oversized, { contentType: 'image/jpeg' }));
  });

  test('owner cannot escape its Storage namespace', async () => {
    const owner = testEnv.authenticatedContext(USER_A, { firebase: { sign_in_provider: 'phone' } });
    await assertFails(putFile(owner.storage().ref(`users/${USER_B}/clothes/other-user.jpg`), jpeg, { contentType: 'image/jpeg' }));
  });
});
