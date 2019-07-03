#!/usr/bin/env node
// Schedule perodic tasks with RabbitMQ

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
console.log(config);

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
    if (task.cron)
      jobs.push(new CronJob(task.cron,
        () => triggerRabbit(task.name, task.task, channel)));
    else // trigger immediately
      setTimeout(() => triggerRabbit(task.name, task.task, channel));
  }

  jobs.forEach(job => job.start());
  console.log(`Cron Jobs Started: ${jobs.length}`);
  proveHealth('rabbit-cron');
}

function triggerRabbit(name, task, channel) {
  console.log(`Enqueueing: ${name || task}`);

  if (typeof task !== 'string') {
    task = JSON.stringify(task);
  }
  channel.sendToQueue(config.queue.name, Buffer.from(task));

  // Prove to HEALTHCHECK we're still alive
  proveHealth('rabbit-cron');
}
