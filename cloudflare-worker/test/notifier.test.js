import assert from 'node:assert/strict';
import test from 'node:test';

import { Notifier, renderTemplate } from '../src/notifier.js';

test('renderTemplate 支持 {{message}} 和 $MSG', () => {
  assert.equal(renderTemplate('内容：{{message}}', { message: '测试' }), '内容：测试');
  assert.equal(renderTemplate('$MSG', { message: '测试' }), '测试');
});

test('custom webhook 发送通用 JSON 载荷', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response('{}', { status: 200 });
  };
  const notifier = new Notifier({ webhook_url: 'https://hook.example/send', webhook_type: 'custom' }, fetcher, () => 123456);

  const result = await notifier.send('标题', '消息', 'critical');
  assert.equal(result.ok, true);
  assert.equal(calls[0].url, 'https://hook.example/send');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    title: '标题',
    message: '消息',
    level: 'critical',
    timestamp: 123456,
  });
});

test('pushplus webhook 发送 token/title/content/template', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response('{"code":200}', { status: 200 });
  };
  const notifier = new Notifier({
    webhook_url: 'https://www.pushplus.plus/send',
    webhook_type: 'pushplus',
    pushplus_token: 'token-1',
  }, fetcher);

  const result = await notifier.send('Uptimer 告警', '服务器 DOWN', 'critical');
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    token: 'token-1',
    title: 'Uptimer 告警',
    content: '服务器 DOWN',
    template: 'txt',
  });
});

test('企业微信机器人 webhook 发送 text 消息', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response('{"errcode":0}', { status: 200 });
  };
  const notifier = new Notifier({
    webhook_url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=abc',
    webhook_type: 'wecom',
  }, fetcher);

  const result = await notifier.send('服务器告警', '主服务器 DOWN', 'critical');
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    msgtype: 'text',
    text: {
      content: '服务器告警\n主服务器 DOWN',
    },
  });
});

test('钉钉机器人 webhook 发送 text 消息', async () => {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response('{"errcode":0}', { status: 200 });
  };
  const notifier = new Notifier({
    webhook_url: 'https://oapi.dingtalk.com/robot/send?access_token=abc',
    webhook_type: 'dingtalk',
  }, fetcher);

  const result = await notifier.send('服务器告警', '主服务器 DOWN', 'critical');
  assert.equal(result.ok, true);
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    msgtype: 'text',
    text: {
      content: 'ZJMF 监控通知\n服务器告警\n主服务器 DOWN',
    },
  });
});
