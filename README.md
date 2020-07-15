# rabbit-cron
Send periodic tasks to RabbitMQ

`npm install thann/rabbit-cron`

`rabbit-cron ./example_tasks.json`

## Tasks format
```
{
	url: 'amqp://USERNAME:PASSWORD@rabbitmq:5672',
	queue: {
		name: "name-of-the-queue",
		... // Queue options
	},
	tasks: [
		{
			cron: '* * * * *', // cron string
			task: 'String or JSON message to be enqueued'
			name: 'human readable name', // unused, optional
			immediate: true, // enqueue on service start
			... // Message options
		}
	]
}
```
See the amqp.node docs for info on the options:
[queue](https://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue)
[message](https://www.squaremobius.net/amqp.node/channel_api.html#channel_publish)

## Docker
Run container with mounted "tasks" file
`docker run --rm -v "./my_tasks.json:/app/example_tasks.json" thann/rabbit-cron`

### Dockerfile
You can easily make a Dockerfile with your tasks baked-in like this:
```
FROM thann/rabbit-cron
COPY ./my_tasks.json /app/
CMD ["./my_tasks.json"]
```

### Advanced
You can use a script to wrap and modify your json format like: `rabbit_cron ./task_mutator.js`
