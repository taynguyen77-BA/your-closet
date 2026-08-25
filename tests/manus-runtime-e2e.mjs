const base = process.env.MANUS_TEST_BASE_URL || 'http://localhost:3000';
const userA = 'manus-user-a';
const userB = 'manus-user-b';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

async function call(path, options = {}, user = userA) {
  const headers = new Headers(options.headers);
  headers.set('X-Wardro-Dev-User', user);
  headers.set('X-Wardro-Frontend-SHA', process.env.MANUS_FRONTEND_SHA || 'development');
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : undefined; } catch { body = text; }
  return { response, body };
}
function assert(condition, message) { if (!condition) throw new Error(message); }
function data(body) { return body?.data ?? body; }

const health = await call('/health');
assert(health.response.status === 200 && health.body.status === 'ok', `health failed: ${JSON.stringify(health.body)}`);
assert(health.body.runtimeMode === 'manus' && health.body.providers.data === 'manus', 'health provider metadata missing');
assert(health.body.requestFrontendSha === (process.env.MANUS_FRONTEND_SHA || 'development'), 'frontend/backend SHA traceability missing');

const session = await call('/api/auth/session/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
assert(session.response.status === 200 && data(session.body).user?.id === userA, 'Manus session failed');
const profile = await call(`/api/resources/users/${userA}`);
assert(profile.response.status === 200 && data(profile.body).id === userA, 'profile read failed');
const profileUpdate = await call(`/api/resources/users/${userA}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: 'Manus Runtime User A' }) });
assert(profileUpdate.response.status === 200 && data(profileUpdate.body).displayName === 'Manus Runtime User A', 'profile update failed');

const publicData = await call('/api/resources/plan_limits?status=active');
assert(publicData.response.status === 200 && Array.isArray(data(publicData.body)), 'public resource read failed');

const form = new FormData();
form.append('image', new Blob([png], { type: 'image/png' }), 'wardrobe.png');
const upload = await call('/api/wardrobe/upload', { method: 'POST', body: form });
assert(upload.response.status === 201, `upload failed: ${JSON.stringify(upload.body)}`);
const uploaded = data(upload.body);
assert(uploaded.provider === 'manus' && uploaded.path.startsWith(`users/${userA}/clothes/`), 'Manus storage reference missing');

const aiForm = new FormData();
aiForm.append('image', new Blob([png], { type: 'image/png' }), 'wardrobe.png');
const ai = await call('/api/ai/clothing/detect', { method: 'POST', headers: { 'Idempotency-Key': 'manus-ai-e2e-1', 'X-Request-Id': 'manus-ai-e2e-1' }, body: aiForm });
assert(ai.response.status === 200 && ai.body.modelUsed === 'manus-vision' && ai.body.qualityWarnings?.some((warning) => String(warning).includes('development provider')), `AI development provider failed: ${JSON.stringify(ai.body)}`);

const payload = {
  userId: userA, name: 'Manus test shirt', imageUrl: uploaded.url, storagePath: uploaded.path,
  originalImageUrl: uploaded.url, originalStoragePath: uploaded.path, type: 'top', color: 'white',
  material: 'cotton', style: 'casual', season: ['summer'], tags: ['e2e'], isFavorite: false, timesWorn: 0,
  aiMetadata: { provider: 'manus-development' }, aiConfidenceScore: 0.5, aiQualityWarnings: ['development-provider'],
};
const created = await call('/api/wardrobe/items', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'manus-create-e2e-1' }, body: JSON.stringify(payload) });
assert(created.response.status === 201, `create failed: ${JSON.stringify(created.body)}`);
const item = data(created.body).item;
assert(item.userId === userA && item.id, 'created item ownership missing');
const replay = await call('/api/wardrobe/items', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'manus-create-e2e-1' }, body: JSON.stringify(payload) });
assert(replay.response.status === 200 && data(replay.body).replayed === true && data(replay.body).item.id === item.id, 'create idempotency failed');

const listed = await call('/api/resources/clothes?userId=manus-user-a');
assert(listed.response.status === 200 && data(listed.body).some((row) => row.id === item.id), 'wardrobe list failed');
const readA = await call(`/api/wardrobe/items/${item.id}`);
assert(readA.response.status === 200 && data(readA.body).id === item.id, 'owner read failed');

for (const [label, result] of [
  ['cross-user read', await call(`/api/wardrobe/items/${item.id}`, {}, userB)],
  ['cross-user update', await call(`/api/wardrobe/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'manus-update-b' }, body: JSON.stringify({ name: 'hijack' }) }, userB)],
  ['cross-user delete', await call(`/api/wardrobe/items/${item.id}`, { method: 'DELETE', headers: { 'Idempotency-Key': 'manus-delete-b' } }, userB)],
]) assert(result.response.status === 403 || result.response.status === 404, `${label} was not denied: ${result.response.status}`);
const storageAsB = await call(uploaded.url, {}, userB);
assert(storageAsB.response.status === 403, `cross-user storage was not denied: ${storageAsB.response.status}`);

const updated = await call(`/api/wardrobe/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'manus-update-a' }, body: JSON.stringify({ name: 'Manus updated shirt', isFavorite: true }) });
assert(updated.response.status === 200 && data(updated.body).name === 'Manus updated shirt', 'owner update failed');
const deleted = await call(`/api/wardrobe/items/${item.id}`, { method: 'DELETE', headers: { 'Idempotency-Key': 'manus-delete-a' } });
assert(deleted.response.status === 204, 'owner delete failed');
const deletedRead = await call(`/api/wardrobe/items/${item.id}`);
assert(deletedRead.response.status === 404, 'deleted item still readable');
const deletedImage = await call(uploaded.url);
assert(deletedImage.response.status === 404, `deleted image still readable: ${deletedImage.response.status}`);

const accountForm = new FormData();
accountForm.append('image', new Blob([png], { type: 'image/png' }), 'account.png');
const bUpload = await call('/api/wardrobe/upload', { method: 'POST', body: accountForm }, userB);
const bStored = data(bUpload.body);
const bPayload = { ...payload, userId: userB, imageUrl: bStored.url, storagePath: bStored.path, originalImageUrl: bStored.url, originalStoragePath: bStored.path };
const bCreate = await call('/api/wardrobe/items', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'manus-create-b-account' }, body: JSON.stringify(bPayload) }, userB);
assert(bCreate.response.status === 201, 'User B setup failed');
const bDeleted = await call('/api/auth/account', { method: 'DELETE' }, userB);
assert(bDeleted.response.status === 200 && data(bDeleted.body).deleted === true, `account deletion failed: ${JSON.stringify(bDeleted.body)}`);
const bImageAfterDelete = await call(bStored.url, {}, userB);
assert(bImageAfterDelete.response.status === 404, `account-owned image still readable: ${bImageAfterDelete.response.status}`);

console.log(JSON.stringify({
  runtime: 'manus', health: 'PASS', session: 'PASS', upload: 'PASS', ai: 'PASS_DEVELOPMENT_PROVIDER',
  persistence: 'PASS', idempotency: 'PASS', ownerCrud: 'PASS', crossUser: 'PASS_DENIED', storageCleanup: 'PASS', accountDeletion: 'PASS',
}, null, 2));
