import assert from 'assert';
import { InputClassifier, isUrlAllowed, getRegistrableDomainFromHost } from '../src/utils/classifier.js';
import { RulesEngine } from '../src/utils/rules-engine.js';

console.log('Running unit tests...');

// Helper
const eq = (a, b, msg) => assert.deepStrictEqual(a, b, msg);

// 1) getRegistrableDomainFromHost
console.log(' - Testing getRegistrableDomainFromHost...');
assert.strictEqual(getRegistrableDomainFromHost('linear.app'), 'linear.app');
assert.strictEqual(getRegistrableDomainFromHost('www.example.co.uk'), 'example.co.uk');
assert.strictEqual(getRegistrableDomainFromHost('a.b.example.co.jp'), 'example.co.jp');
assert.strictEqual(getRegistrableDomainFromHost('mysite.com'), 'mysite.com');

// 2) InputClassifier.classify
console.log(' - Testing InputClassifier.classify...');
const c = new InputClassifier();
assert.deepStrictEqual(c.classify('.app'), { type: 'tld', value: '.app' });
assert.strictEqual(c.classify('youtube.com').type, 'domain');
assert.strictEqual(c.classify('www.youtube.com').type, 'subdomain');
const u = c.classify('https://example.com/path?x=1#frag');
assert.strictEqual(u.type, 'url');
assert.strictEqual(u.value, 'https://example.com/path?x=1');

// 3) isUrlAllowed
console.log(' - Testing isUrlAllowed...');
let entries = [{ type: 'tld', value: '.app' }];
assert.strictEqual(isUrlAllowed('https://linear.app', entries), true);
assert.strictEqual(isUrlAllowed('https://sub.linear.app/some', entries), true);

entries = [{ type: 'domain', value: 'example.com' }];
assert.strictEqual(isUrlAllowed('https://example.com', entries), true);
assert.strictEqual(isUrlAllowed('https://sub.example.com/path', entries), true);

entries = [{ type: 'subdomain', value: 'docs.google.com' }];
assert.strictEqual(isUrlAllowed('https://docs.google.com', entries), true);
assert.strictEqual(isUrlAllowed('https://x.docs.google.com', entries), false);

entries = [{ type: 'host', value: 'exact.example.com' }];
assert.strictEqual(isUrlAllowed('https://exact.example.com', entries), true);
assert.strictEqual(isUrlAllowed('https://sub.exact.example.com', entries), false);

entries = [{ type: 'origin', value: 'https://example.com' }];
assert.strictEqual(isUrlAllowed('https://example.com/path', entries), true);
assert.strictEqual(isUrlAllowed('https://example.com', entries), true);
assert.strictEqual(isUrlAllowed('http://example.com', entries), false);

entries = [{ type: 'url', value: 'https://example.com/foo' }];
assert.strictEqual(isUrlAllowed('https://example.com/foo', entries), true);
assert.strictEqual(isUrlAllowed('https://example.com/foo/', entries), true);
assert.strictEqual(isUrlAllowed('https://example.com/foo?x=1', entries), false);

// 4) RulesEngine.buildAllowRule regex behavior (basic)
console.log(' - Testing RulesEngine.buildAllowRule regex...');
const rules = new RulesEngine();
const rTld = rules.buildAllowRule(1000, { type: 'tld', value: '.app' });
assert.ok(rTld, 'tld allow rule should be built');
const reTld = new RegExp(rTld.condition.regexFilter);
assert.strictEqual(reTld.test('https://linear.app'), true);
assert.strictEqual(reTld.test('https://example.com'), false);

const rDom = rules.buildAllowRule(1001, { type: 'domain', value: 'example.com' });
const reDom = new RegExp(rDom.condition.regexFilter);
assert.strictEqual(reDom.test('https://example.com/'), true);
assert.strictEqual(reDom.test('https://sub.example.com/path'), true);
assert.strictEqual(reDom.test('https://notexample.com'), false);

console.log('\nAll tests passed ✓');
process.exitCode = 0;
