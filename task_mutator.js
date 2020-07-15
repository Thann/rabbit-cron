
// Make arbitrary adjustments to the config format
const config = require('./example_tasks.json');
module.exports = config;
config.tasks = config.tasks.map(t => ({
  cron: t.cron,
  priority: t.priority,
  immediate: t.immediate,
  // convert seconds to milliseconds
  expiration: t.expiration && t.expiration * 1000,
  task: { // Arbitrary task extensions
    arbitrary: true,
    data: t.task,
  },
}));
//console.log({config});

