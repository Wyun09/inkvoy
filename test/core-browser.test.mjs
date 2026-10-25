import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { DeepSeekBrowser } from '../js/core/browser.js';

const emptyState = {
  originMatches: true, loginRequired: false, needsVerification: false,
  composerCount: 1, messageCount: 0, answerCount: 0,
  composerTextLength: 0, chatPath: '/', readAloudFound: false, readAloudRawCount: 0, readAloudVisibleCount: 0,
  text: '', reasoningText: '', reasoningCount: 0, completed: false, siteError: false,
  textSource: 'single_code_block', textUncertain: false, reasoningUncertain: false,
};

class FakePage extends EventEmitter {
  constructor() { super(); this.closed = false; this.sent = []; this.prompt = ''; this.uploaded = []; }
  async goto(url) { this.url = url; }
  isClosed() { return this.closed; }
  async close() { this.closed = true; }
  locator(selector) {
    if (selector === 'input[type="file"]') return {
      count: async () => 1, evaluate: async () => true,
      setInputFiles: async files => { this.uploaded.push(...files); },
    };
    return {
      fill: async prompt => { this.prompt = prompt; },
      inputValue: async () => this.truncateLength ? this.prompt.slice(0, this.truncateLength) : this.prompt,
      press: async key => { this.sent.push({ key, prompt: this.prompt }); },
    };
  }
  getByRole() { return { count: async () => 0 }; }
}

class FakeBrowser extends DeepSeekBrowser {
  constructor(states, extra = {}) {
    super({ profileDir: path.join(os.tmpdir(), 'unused-bridge-test-profile'), pollMs: 100, timeoutMs: 5000, ...extra });
    this.states = states;
    this.pages = [];
    this.preflightState = {};
    this.uploadStates = [];
    this.modeChanges = [];
    this.submissionState = null;
  }
  async _ensureBrowser() {
    this._context = { close: async () => {} };
    if (!this._page || this._page.isClosed()) {
      this._page = new FakePage();
      this._page.truncateLength = this.truncateLength;
      this.pages.push(this._page);
    }
    return this._page;
  }
  async _readState() {
    if (this._activeRequest?.phase === 'uploading_images') return { ...emptyState };
    if (this._activeRequest?.phase === 'filling_prompt') return { ...emptyState, composerTextLength: this._page.prompt.length, ...this.preflightState };
    if (this._activeRequest?.phase === 'submitting' && this.submissionState) return { ...emptyState, ...this.submissionState };
    const state = this.states.length > 1 ? this.states.shift() : this.states[0];
    return { ...emptyState, ...state };
  }
  async _setReasoning(_page, enabled) { this.modeChanges.push(enabled); }
  async _decodeImages() {}
  async _readUploadState() {
    return this.uploadStates.length > 1 ? this.uploadStates.shift() : this.uploadStates[0];
  }
}

test('stable output tolerates rewritten body and thought text until the final completed snapshot',async()=>{
 const browser=new FakeBrowser([{},
  {answerCount:1,text:'Old draft',reasoningCount:1,reasoningText:'Old thought'},
  {answerCount:1,text:'Rewritten final',reasoningCount:1,reasoningText:'Rewritten thought'},
  {answerCount:1,text:'Rewritten final',reasoningCount:1,reasoningText:'Rewritten thought',completed:true},
 ]);
 const frames=[];for await(const event of browser.generate({prompt:'Check',reasoning:true,stableOutput:true}))frames.push(event);
 assert.equal(frames.filter(f=>f.type==='text').map(f=>f.delta).join(''),'Rewritten final');
 assert.equal(frames.filter(f=>f.type==='reasoning').map(f=>f.delta).join(''),'Rewritten thought');
 assert.equal(frames.filter(f=>f.type==='text').length,1);
});

test('temporary turn boundary reflow waits and never emits its unconfirmed text',async()=>{
 const browser=new FakeBrowser([{},
  {answerCount:1,text:'DO_NOT_EMIT',turnPending:true},
  {answerCount:0,text:'',turnPending:true},
  {answerCount:1,text:'CONFIRMED',turnPending:false,completed:true},
 ]);
 const events=[];for await(const event of browser.generate({prompt:'Check',stableOutput:true}))events.push(event);
 assert.equal(events.filter(event=>event.type==='text').map(event=>event.delta).join(''),'CONFIRMED');
 assert.equal(events.at(-1).type,'done');assert.equal(browser.pages[0].sent.length,1);
});
test('streams only new text and waits for an explicit completion control', async () => {
  const browser = new FakeBrowser([
    {},
    { answerCount: 1, text: 'Hello' },
    { answerCount: 1, text: 'Hello world' },
    { answerCount: 1, text: 'Hello world', completed: true },
  ]);
  const chunks = [];
  for await (const chunk of browser.generate({ prompt: 'Say hello' })) chunks.push(chunk);
  assert.deepEqual(chunks, [{ type: 'ready' }, { type: 'text', delta: 'Hello' },
    { type: 'text', delta: ' world' }, { type: 'done', finishReason: 'stop' }]);
  assert.deepEqual(browser.pages[0].sent, [{ key: 'Enter', prompt: 'Say hello' }]);
  assert.equal(browser.pages[0].closed, false);
});

test('old conversation history is cleared before validating the new response layout', async () => {
  const browser = new FakeBrowser([
    { messageCount: 4, answerCount: 2, reasoningCount: 2 },
    { messageCount: 4, answerCount: 2, reasoningCount: 2 },
    {},
    { messageCount: 2, answerCount: 1, text: 'NEW_ONLY', completed: true },
  ]);
  let clicks = 0;
  const ensure = browser._ensureBrowser.bind(browser);
  browser._ensureBrowser = async () => {
    const page = await ensure();
    page.getByRole = () => ({ count: async () => 1, isVisible: async () => true, click: async () => { clicks++; } });
    return page;
  };
  const events = [];
  for await (const event of browser.generate({ prompt: 'New question' })) events.push(event);
  assert.equal(clicks, 1);
  assert.equal(events.filter(event => event.type === 'text').map(event => event.delta).join(''), 'NEW_ONLY');
});

test('transient duplicate response containers settle without publishing ambiguous text', async () => {
  const browser = new FakeBrowser([{},
    { answerCount: 2, text: 'DO_NOT_PUBLISH' },
    { answerCount: 1, text: 'Current answer', completed: true },
  ]);
  const events = [];
  for await (const event of browser.generate({ prompt: 'Reply' })) events.push(event);
  assert.equal(events.filter(event => event.type === 'text').map(event => event.delta).join(''), 'Current answer');
});

test('persistent ambiguous response containers fail with counts and never mix replies', async () => {
  const browser = new FakeBrowser([{}, { answerCount: 2, text: 'DO_NOT_PUBLISH' }]);
  const events = [];
  await assert.rejects(async () => {
    for await (const event of browser.generate({ prompt: 'Reply' })) events.push(event);
  }, error => error.code === 'PAGE_CHANGED' && error.details.answerContainers === 2 && error.details.phase === 'generating');
  assert.ok(!events.some(event => event.type === 'text'));
});

test('partial closing fences are never published as answer text', async () => {
  const browser = new FakeBrowser([{},
    { answerCount: 1, text: 'OK' },
    { answerCount: 1, text: 'OK\n' },
    { answerCount: 1, text: 'OK\n``' },
    { answerCount: 1, text: 'OK', completed: true },
  ]);
  const events = [];
  for await (const event of browser.generate({ prompt: 'Say OK' })) events.push(event);
  assert.equal(events.filter(event => event.type === 'text').map(event => event.delta).join(''), 'OK');
  assert.equal(events.at(-1).type, 'done');
});

test('discarding the last persistent tab waits for its context before admitting another request', async () => {
  const browser = new FakeBrowser([{}]);
  const page = new FakePage();
  let finishedClosing = false;
  browser._page = page;
  browser._context = { pages: () => [page], close: async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    page.closed = true;
    finishedClosing = true;
  } };
  await browser._discardPage(page);
  assert.equal(browser._context, null);
  assert.equal(browser._page, null);
  assert.equal(finishedClosing, true);
});

test('thought paragraphs stream before the answer while mutable inline Markdown stays private until stable', async () => {
  const finalThought = 'First completed paragraph.\n\nUse (`````text), then answer.';
  const browser = new FakeBrowser([{},
    { reasoningCount: 1, reasoningText: 'First completed paragraph.\n\nUse (````text), then answer.', reasoningStableText: 'First completed paragraph.' },
    { reasoningCount: 1, reasoningText: finalThought, reasoningStableText: 'First completed paragraph.' },
    { answerCount: 1, text: '423', reasoningCount: 1, reasoningText: finalThought, reasoningStableText: 'First completed paragraph.', completed: true },
  ]);
  const events = [];
  for await (const event of browser.generate({ prompt: 'Solve the problem', reasoning: true })) events.push(event);
  assert.equal(events.filter(event => event.type === 'reasoning').map(event => event.delta).join(''), finalThought);
  assert.ok(events.findIndex(event => event.type === 'reasoning') < events.findIndex(event => event.type === 'text'));
});

test('last thought paragraph can finish rendering after body starts without changing published reasoning', async () => {
  const prefix = 'Completed reasoning.';
  const initial = prefix + '\n\nClosing line ````.';
  const final = prefix + '\n\nClosing line `````.';
  const browser = new FakeBrowser([{},
    { reasoningCount: 1, reasoningText: initial, reasoningStableText: prefix },
    { reasoningCount: 1, reasoningText: initial, reasoningStableText: prefix, answerCount: 1, text: 'The answer' },
    { reasoningCount: 1, reasoningText: final, reasoningStableText: prefix, answerCount: 1, text: 'The answer is 423.', completed: true },
  ]);
  const events = [];
  for await (const event of browser.generate({ prompt: 'Solve', reasoning: true })) events.push(event);
  assert.equal(events.filter(event => event.type === 'reasoning').map(event => event.delta).join(''), final);
  assert.equal(events.filter(event => event.type === 'text').map(event => event.delta).join(''), 'The answer is 423.');
  assert.ok(events.findIndex(event => event.type === 'text') < events.findLastIndex(event => event.type === 'reasoning'), 'Only the mutable thought tail is delayed; body streaming continues.');
});

test('cancellation closes its tab and the next request gets a fresh page', async () => {
  const browser = new FakeBrowser([{}, { answerCount: 1, text: 'first' }]);
  const controller = new AbortController();
  const stream = browser.generate({ prompt: 'First', signal: controller.signal });
  assert.deepEqual((await stream.next()).value, { type: 'ready' });
  assert.deepEqual((await stream.next()).value, { type: 'text', delta: 'first' });
  controller.abort();
  await assert.rejects(stream.next(), error => error.code === 'REQUEST_CANCELLED' && error.status === 499);
  assert.equal(browser.pages[0].closed, true);
  browser.states = [{}, { answerCount: 1, text: 'second', completed: true }];
  const chunks = [];
  for await (const chunk of browser.generate({ prompt: 'Second' })) chunks.push(chunk.delta);
  assert.equal(chunks.join(''), 'second');
  assert.equal(browser.pages.length, 2);
  assert.equal(browser.pages[1].prompt, 'Second');
});

test('ending a stream early closes the abandoned page', async () => {
  const browser = new FakeBrowser([{}, { answerCount: 1, text: 'partial' }]);
  const stream = browser.generate({ prompt: 'Hello' });
  await stream.next();
  await stream.return();
  assert.equal(browser.pages[0].closed, true);
  assert.equal(browser._active, false);
});

test('requires human verification without filling or sending a prompt', async () => {
  const browser = new FakeBrowser([{ needsVerification: true }]);
  await assert.rejects(async () => {
    for await (const _ of browser.generate({ prompt: 'Hello' })) { /* no output expected */ }
  }, error => error.code === 'VERIFICATION_REQUIRED' && error.status === 428);
  assert.equal(browser.pages[0].prompt, '');
  assert.equal(browser.pages[0].sent.length, 0);
});

test('refuses old conversations instead of mixing history', async () => {
  const browser = new FakeBrowser([{ messageCount: 2, answerCount: 1, text: 'old reply' }]);
  await assert.rejects(async () => {
    for await (const _ of browser.generate({ prompt: 'Hello' })) { /* no output expected */ }
  }, error => error.code === 'CONVERSATION_NOT_EMPTY');
  assert.equal(browser.pages[0].sent.length, 0);
});

test('times out when there is text but no trustworthy completion marker', async () => {
  const browser = new FakeBrowser([{}, { answerCount: 1, text: 'still pending' }], { timeoutMs: 1000 });
  await assert.rejects(async () => {
    for await (const _ of browser.generate({ prompt: 'Hello' })) { /* consume partial output */ }
  }, error => error.code === 'REQUEST_TIMEOUT' && error.status === 504);
  assert.equal(browser.pages[0].closed, true);
});

test('an accepted request with no raw answer or thought hits its first-output deadline and cleans up', async () => {
  const browser = new FakeBrowser([{}, { messageCount: 1 }], { pollMs: 20, firstOutputTimeoutMs: 150 });
  const events = [];
  await assert.rejects(async () => {
    for await (const event of browser.generate({ prompt: 'Reply' })) events.push(event);
  }, error => error.code === 'UPSTREAM_NO_OUTPUT' && error.status === 504 && error.details.firstOutputTimeoutMs === 150);
  assert.deepEqual(events, [{ type: 'ready' }]);
  assert.equal(browser.pages[0].sent.length, 1);
  assert.equal(browser.pages[0].closed, true);
  assert.equal(browser._active, false);
});

test('a buffered raw thought prevents an empty-response retry even before it can be streamed', async () => {
  const thought = { reasoningCount: 1, reasoningText: 'One unfinished thought paragraph.', reasoningStableText: '' };
  const browser = new FakeBrowser([{}, ...Array.from({ length: 15 }, () => ({ ...thought })),
    { ...thought, answerCount: 1, text: 'Final', completed: true },
  ], { pollMs: 20, firstOutputTimeoutMs: 100 });
  const events = [];
  for await (const event of browser.generate({ prompt: 'Think and reply', reasoning: true })) events.push(event);
  assert.equal(events.filter(event => event.type === 'reasoning').map(event => event.delta).join(''), thought.reasoningText);
  assert.equal(events.filter(event => event.type === 'text').map(event => event.delta).join(''), 'Final');
  assert.equal(browser.pages[0].sent.length, 1);
});

test('rejects a rewrite of already streamed text', async () => {
  const browser = new FakeBrowser([
    {}, { answerCount: 1, text: 'Hello' }, { answerCount: 1, text: 'Hello' },
    { answerCount: 1, text: 'Different answer' },
  ]);
  await assert.rejects(async () => {
    for await (const _ of browser.generate({ prompt: 'Hello' })) { /* consume partial output */ }
  }, error => error.code === 'ANSWER_REVISED');
  assert.equal(browser.pages[0].closed, true);
});

test('a transient empty protected pre is skipped while real committed changes still fail', async () => {
  const browser = new FakeBrowser([
    {}, { answerCount: 1, text: '{"content":"Hi' },
    { answerCount: 1, text: '', textUncertain: true },
    { answerCount: 1, text: '{"content":"Hi there"}', completed: true },
  ], { pollMs: 20 });
  const chunks = [];
  for await (const event of browser.generate({ prompt: 'Protected transport' })) if (event.type === 'text') chunks.push(event.delta);
  assert.deepEqual(chunks, ['{"content":"Hi', ' there"}']);
});

test('forwards each of twenty actual DOM updates immediately, before completion', async () => {
  const values = Array.from({ length: 20 }, (_, index) => Array.from({ length: index + 1 }, (__, number) => String(number + 1)).join(' '));
  const browser = new FakeBrowser([{}, ...values.map(text => ({ answerCount: 1, text })),
    { answerCount: 1, text: values.at(-1), completed: true }], { pollMs: 20 });
  const chunks = [];
  const startedAt = Date.now();
  let finishedAt;
  for await (const chunk of browser.generate({ prompt: 'Count from 1 to 20' })) {
    if (chunk.type === 'text') chunks.push({ delta: chunk.delta, at: Date.now() });
    if (chunk.type === 'done') finishedAt = Date.now();
  }
  assert.equal(chunks.length, 20);
  assert.equal(chunks.map(chunk => chunk.delta).join(''), values.at(-1));
  assert.ok(chunks[0].at - startedAt < 200, 'first observed text is forwarded without another poll');
  assert.ok(finishedAt - chunks[0].at > 300, 'text reaches the consumer well before generation completes');
});

test('reasoning streams before the answer and remains a separate channel', async () => {
  const browser = new FakeBrowser([
    {}, { reasoningCount: 1, reasoningText: 'First thought' },
    { reasoningCount: 1, reasoningText: 'First thought, second thought' },
    { reasoningCount: 1, reasoningText: 'First thought, second thought', answerCount: 1, text: 'Answer' },
    { reasoningCount: 1, reasoningText: 'First thought, second thought', answerCount: 1, text: 'Answer done', completed: true },
  ], { pollMs: 20 });
  const chunks = [];
  for await (const chunk of browser.generate({ prompt: 'Think', reasoning: true })) chunks.push(chunk);
  const reasoningChunks = chunks.filter(chunk => chunk.type === 'reasoning');
  const textChunks = chunks.filter(chunk => chunk.type === 'text');
  assert.equal(reasoningChunks.map(chunk => chunk.delta).join(''), 'First thought, second thought');
  assert.equal(textChunks.map(chunk => chunk.delta).join(''), 'Answer done');
  assert.equal(chunks[1].type, 'reasoning');
  assert.deepEqual(browser.modeChanges, [true, true]);
});

const images = ['one.png', 'two.png'].map((name, sourceIndex) => ({ name, sourceIndex,
  mimeType: 'image/png', buffer: Buffer.from('test image bytes; actual decoding is tested in the real DOM fixture') }));

test('does not fill or send text when even one image is not ready', async () => {
  const browser = new FakeBrowser([{}], { uploadTimeoutMs: 1000, pollMs: 20 });
  browser.uploadStates = [{ count: 2, readyCount: 1, pendingCount: 1, failed: false, names: images.map(image => image.name) }];
  let readySeen = false;
  await assert.rejects(async () => {
    for await (const event of browser.generate({ prompt: 'Describe both', images })) if (event.type === 'ready') readySeen = true;
  }, error => error.status === 400 && error.code === 'image_upload_timeout');
  assert.equal(readySeen, false);
  assert.equal(browser.pages[0].prompt, '');
  assert.deepEqual(browser.pages[0].sent, []);
  assert.equal(browser.pages[0].closed, true);
});

test('an incomplete attachment count never submits an otherwise ready thumbnail', async () => {
  const browser = new FakeBrowser([{}], { uploadTimeoutMs: 1000, pollMs: 20 });
  browser.uploadStates = [{ count: 1, readyCount: 1, pendingCount: 0, failed: false, names: ['one.png'] }];
  await assert.rejects(async () => {
    for await (const _ of browser.generate({ prompt: 'Describe both', images })) { /* must never be ready */ }
  }, error => error.status === 400 && error.code === 'image_upload_timeout');
  assert.equal(browser.pages[0].prompt, '');
  assert.deepEqual(browser.pages[0].sent, []);
});

test('all images and quiet network are required before ready and Enter', async () => {
  const browser = new FakeBrowser([{}, { answerCount: 1, text: 'Both images', completed: true }], { pollMs: 20 });
  browser.uploadStates = [
    { count: 1, readyCount: 1, pendingCount: 0, failed: false, names: ['one.png'] },
    { count: 2, readyCount: 2, pendingCount: 0, failed: false, names: ['one.png', 'two.png'] },
  ];
  const start = Date.now();
  for await (const chunk of browser.generate({ prompt: 'Describe both', images })) {
    if (chunk.type === 'ready') {
      assert.equal(browser.pages[0].uploaded.length, 2);
      assert.equal(browser.pages[0].sent.length, 0);
      assert.ok(Date.now() - start >= 390, 'thumbnail readiness alone does not skip network quiet');
      const status = await browser.status();
      assert.equal(status.active, true);
      assert.equal(status.activeRequest.imageCount, 2);
      assert.equal(status.activeRequest.phase, 'ready');
    }
  }
  assert.equal(browser.pages[0].sent.length, 1);
});

test('upload failure remains a 400 before ready and text submission', async () => {
  const browser = new FakeBrowser([{}]);
  browser.uploadStates = [{ count: 1, readyCount: 0, pendingCount: 0, failed: true, names: ['one.png'] }];
  await assert.rejects(async () => {
    for await (const _ of browser.generate({ prompt: 'Describe', images: images.slice(0, 1) })) { /* must never be ready */ }
  }, error => error.status === 400 && error.code === 'image_upload_failed');
  assert.equal(browser.pages[0].prompt, '');
  assert.deepEqual(browser.pages[0].sent, []);
});

test('the full prompt is checked and a shortened textarea produces explicit lengths', async () => {
  const browser = new FakeBrowser([{}]);
  browser.truncateLength = 5;
  const prompt = 'The full prompt must never be truncated';
  await assert.rejects(async () => {
    for await (const _ of browser.generate({ prompt })) { /* must never be ready */ }
  }, error => error.status === 400 && error.code === 'context_length_exceeded'
    && error.requestedLength === prompt.length && error.actualLength === 5);
  assert.equal(browser.pages[0].prompt, prompt, 'the adapter passes the complete prompt to fill');
  assert.equal(browser.pages[0].sent.length, 0);
});

test('submission is confirmed before generating; an unaccepted Enter is never retried', async () => {
  const browser = new FakeBrowser([{}], { timeoutMs: 7000, pollMs: 20 });
  const prompt = 'Submission probe';
  browser.submissionState = { composerTextLength: prompt.length };
  const stream = browser.generate({ prompt });
  assert.equal((await stream.next()).value.type, 'ready');
  assert.equal(browser._activeRequest.phase, 'ready');
  const next = stream.next();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(browser._activeRequest.phase, 'submitting');
  assert.equal(browser._activeRequest.textareaChars, prompt.length);
  await assert.rejects(next, error => error.status === 400 && error.code === 'webpage_submission_failed');
  assert.equal(browser.pages[0].sent.length, 1);
  assert.equal(browser.pages[0].closed, true);
});

test('active diagnostics expose lengths and completion facts without prompt or response text', async () => {
  const browser = new FakeBrowser([{}, { reasoningCount: 1, reasoningText: 'PRIVATE REASONING',
    answerCount: 1, text: 'PRIVATE ANSWER', readAloudFound: true, readAloudRawCount: 1, readAloudVisibleCount: 0 }]);
  const stream = browser.generate({ prompt: 'PRIVATE PROMPT', reasoning: true });
  await stream.next();
  const chunk = await stream.next();
  assert.equal(chunk.value.type, 'reasoning');
  const { activeRequest } = await browser.status();
  assert.equal(activeRequest.phase, 'generating');
  assert.ok(activeRequest.lastObservationMs > 0);
  assert.equal(activeRequest.responseChars, 'PRIVATE ANSWER'.length);
  assert.equal(activeRequest.reasoningChars, 'PRIVATE REASONING'.length);
  assert.equal(activeRequest.completedMarker, false);
  assert.equal(activeRequest.textareaChars, 0);
  assert.equal(activeRequest.answerCount, 1);
  assert.equal(activeRequest.readAloudRawCount, 1);
  assert.equal(activeRequest.readAloudVisibleCount, 0);
  assert.doesNotMatch(JSON.stringify(activeRequest), /PRIVATE/);
  await stream.return();
});

test('a stalled DOM observation uses the read budget while preserving the total deadline', async () => {
  const browser = new FakeBrowser([{}]);
  browser._readState = () => new Promise(() => {});
  const start = Date.now();
  await assert.rejects(browser._readStateBounded({}, undefined, Date.now() + 10_000, Date.now() + 60),
    error => error.status === 504 && error.code === 'webpage_observation_timeout');
  assert.ok(Date.now() - start < 1000);
  await assert.rejects(browser._readStateBounded({}, undefined, Date.now() + 60),
    error => error.status === 504 && error.code === 'REQUEST_TIMEOUT');
});

test('a dedicated profile persists, while an unrelated existing profile is refused', async t => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'deepseek-bridge-profile-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const owned = new DeepSeekBrowser({ profileDir: path.join(temp, 'owned') });
  await owned._prepareProfile();
  await owned._prepareProfile();
  const unrelatedPath = path.join(temp, 'unrelated');
  await fs.mkdir(unrelatedPath);
  await fs.writeFile(path.join(unrelatedPath, 'ExistingProfile'), 'keep me');
  const unrelated = new DeepSeekBrowser({ profileDir: unrelatedPath });
  await assert.rejects(unrelated._prepareProfile(), error => error.code === 'UNSAFE_PROFILE');
  assert.equal(await fs.readFile(path.join(unrelatedPath, 'ExistingProfile'), 'utf8'), 'keep me');
});

test('real DOM: scoped completion, explicit mode, image decoding and transparent upload overlays', async t => {
  const { chromium } = await import('playwright');
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  } catch {
    t.skip('Install a Playwright Chromium browser (or Microsoft Edge on Windows) to run the local DOM fixture.');
    return;
  }
  t.after(() => browser.close());
  const page = await browser.newPage();
  const adapter = new DeepSeekBrowser({ profileDir: path.join(os.tmpdir(), 'unused-bridge-dom-profile') });
  const fixture = ({ toolbar = true, extra = '' } = {}) => `<!doctype html><html><body>
    <main id="conversation">
      <section id="old-wrapper"><div role="button" aria-label="朗读">old toolbar</div></section>
      <section id="current-wrapper">
        <div class="ds-message">
          <div class="ds-think-content"><div class="ds-markdown">Private reasoning must stay out</div></div>
          <div class="ds-markdown ds-assistant-message-main-content"><p>Final answer</p><p>Second paragraph</p></div>
        </div>
        ${toolbar ? '<div class="toolbar"><div role="button" aria-label="朗读">read</div></div>' : ''}
        ${extra}
      </section>
    </main>
    <textarea placeholder="给 DeepSeek 发送消息 "></textarea>
  </body></html>`;

  await page.setContent(fixture());
  const finished = await adapter._readState(page);
  assert.equal(finished.answerCount, 1);
  assert.equal(finished.completed, true);
  assert.match(finished.text, /^Final answer\n/);
  assert.doesNotMatch(finished.text, /reasoning/);
  assert.equal(await page.locator('.ds-message [aria-label]').count(), 0);

  await page.locator('.ds-assistant-message-main-content').evaluate(root => {
    const nested = document.createElement('div');
    nested.className = root.className;
    nested.append(...root.childNodes);
    root.append(nested);
    const unrelated = document.createElement('textarea');
    unrelated.placeholder = 'Artifact editor';
    document.body.append(unrelated);
    const oldThought = document.createElement('div');
    oldThought.className = 'ds-think-content';
    oldThought.textContent = 'Unrelated old thought';
    document.querySelector('#old-wrapper').append(oldThought);
  });
  const nestedSnapshot = await adapter._readState(page);
  assert.equal(nestedSnapshot.answerCount, 1, 'nested renderer containers are not separate answers');
  assert.equal(nestedSnapshot.reasoningCount, 1, 'only thoughts owned by this answer are selected');
  assert.equal(nestedSnapshot.composerCount, 1, 'an artifact textarea is not the DeepSeek composer');
  assert.equal(await page.locator(nestedSnapshot.composerSelector).count(), 1);
  assert.equal(nestedSnapshot.text, finished.text);
  await page.locator('#current-wrapper .ds-think-content').evaluate(element => element.remove());
  assert.equal((await adapter._readState(page)).reasoningCount, 0, 'an old thought outside this reply is not used when the new reply has none');

  await page.setContent(fixture({ toolbar: false }));
  assert.equal((await adapter._readState(page)).completed, false, 'an old sibling toolbar must not complete the current answer');

  await page.setContent(fixture({ extra: '<div hidden class="ds-markdown ds-assistant-message-main-content">Old hidden answer</div>' }));
  const ambiguous = await adapter._readState(page);
  assert.equal(ambiguous.answerCount, 1, 'only the current answer is visible');
  assert.equal(ambiguous.completed, false, 'a wrapper holding a second answer is not a trusted completion scope');

  await page.setContent(fixture());
  await page.locator('.toolbar').evaluate(element => { element.style.opacity = '0'; });
  const hiddenToolbar = await adapter._readState(page);
  assert.equal(hiddenToolbar.completed, false, 'a transparent ancestor hides the completion toolbar');
  assert.equal(hiddenToolbar.readAloudFound, true);
  assert.equal(hiddenToolbar.readAloudRawCount, 1);
  assert.equal(hiddenToolbar.readAloudVisibleCount, 0);

  await page.route('https://chat.deepseek.com/**', route => route.fulfill({ contentType: 'text/html', body: '' }));
  await page.goto('https://chat.deepseek.com/');
  await page.setContent('<div tabindex="0" aria-pressed="true" class="ds-toggle-button ds-toggle-button--selected" onclick="this.setAttribute(\'aria-pressed\', this.getAttribute(\'aria-pressed\') === \'true\' ? \'false\' : \'true\')"><span>深度思考</span></div>');
  assert.equal((await adapter._readReasoningMode(page)).enabled, true);
  await adapter._setReasoning(page, false, undefined, Date.now() + 3000);
  assert.equal((await adapter._readReasoningMode(page)).enabled, false);
  await adapter._setReasoning(page, true, undefined, Date.now() + 3000);
  assert.equal((await adapter._readReasoningMode(page)).enabled, true);
  await page.locator('[aria-pressed]').evaluate(element => { element.removeAttribute('aria-pressed'); element.className = ''; });
  await assert.rejects(adapter._setReasoning(page, false, undefined, Date.now() + 3000), error => error.status === 400 && error.code === 'reasoning_state_unknown');

  const pngBase64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    context.fillStyle = 'red';
    context.fillRect(0, 0, 1, 1);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const png = { name: 'upgrade-red.png', mimeType: 'image/png', sourceIndex: 0, buffer: Buffer.from(pngBase64, 'base64') };
  await adapter._decodeImages(page, [png], undefined, Date.now() + 3000);
  await assert.rejects(adapter._decodeImages(page, [{ ...png, buffer: png.buffer.subarray(0, Math.floor(png.buffer.length / 2)) }], undefined, Date.now() + 3000),
    error => error.status === 400 && error.code === 'invalid_image_data');

  await page.setContent(`<div role="button" class="d5fa3d1b _183e647">
    <img alt="upgrade-red.png" src="data:image/png;base64,${pngBase64}" width="40" height="40">
    <div class="fb3b3771" id="overlay"><span class="ds-loading" data-icon="spin">0%</span></div>
  </div>`);
  await page.locator('img').evaluate(async image => { await image.decode(); });
  const loading = await adapter._readUploadState(page, [png]);
  assert.deepEqual({ count: loading.count, ready: loading.readyCount, pending: loading.pendingCount }, { count: 1, ready: 0, pending: 1 });
  await page.locator('#overlay').evaluate(element => { element.style.opacity = '0'; });
  const ready = await adapter._readUploadState(page, [png]);
  assert.equal(await page.locator('.ds-loading').count(), 1, 'DeepSeek leaves the loading DOM in place');
  assert.deepEqual({ count: ready.count, ready: ready.readyCount, pending: ready.pendingCount, names: ready.names },
    { count: 1, ready: 1, pending: 0, names: ['upgrade-red.png'] });
});
