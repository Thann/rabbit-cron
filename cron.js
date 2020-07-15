#!/usr/bin/env node
// Schedule periodic tasks with RabbitMQ

'use strict';
const path = require('path');
const CronJob = require('cron').CronJob;
const { proveHealth } = require('health');
const amqp = require('amqplib/callback_api');


if (!process.argv[2]) {
  console.error('No tasks.json file provided!');
  process.exit(1);
}

console.log('Initializing Cron Jobs');
const config = require(path.join(process.cwd(), process.argv[2]));
// console.log(config);

// Connect to RabbitMQ
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
const connect = function connect() {
  amqp.connect(config.url, async (err, conn) => {
    // init loops to continually retry connection on failure
    if (err !== null) {
      console.log('[RMQ] Connection Error: %s',
        err.code ? err.code : err, '(Auto-retry in 5s)');
      await snooze(5000);
      connect();
      return;
    }

    process.once('SIGINT', () => {
      conn.close();
    });

    conn.createChannel((err, channel) => {
      if (err !== null) {
        console.error(err);
        return;
      }

      channel.assertQueue(config.queue.name, config.queue, (err, ok) => {
        if (err !== null) {
          console.error(err);
          return;
        }
        start(channel);
      });
    });
  });
};
connect();

function start(channel) {
  const jobs = [];
  for (const task of config.tasks) {
    const fn = rabbinical(task, channel);
    if (task.cron)
      jobs.push(new CronJob(task.cron, fn));
    if (!task.cron || task.immediate)
      setTimeout(fn);
  }

  jobs.forEach(job => job.start());
  console.log(`Cron Jobs Started: ${jobs.length}`);
  proveHealth('rabbit-cron');
}

// turn a task into a function that sends the task to the queue
function rabbinical(task, channel) {
  const logMsg = `Enqueueing: ${JSON.stringify(task, undefined, 2)}`;
  const opts = {};
  // Pass all other props as options to "sendToQueue"
  for (const key in task) {
    if (!(key in ['name', 'cron', 'task', 'immediate']))
      opts[key] = task[key];
  }
  // turn task into a string then a buffer
  if (typeof task.task !== 'string') {
    task.task = JSON.stringify(task.task);
  }
  task.task = Buffer.from(task.task);

  return function() {
    console.log(logMsg);
    channel.sendToQueue(config.queue.name, task.task, opts);
    // Prove to HEALTHCHECK we're still alive
    proveHealth('rabbit-cron');
  }
}
