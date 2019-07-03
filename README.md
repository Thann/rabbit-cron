# rabbit-cron
Send periodic tasks to RabbitMQ

`npm install thann/rabbit-cron`
```
cron.js ./example_tasks.json
```

### Dockerfile
You can easily make a Dockerfile with your tasks baked-in like this:
```
FROM thann/rabbit-cron
COPY ./my_tasks.json /app/
CMD ["./my_tasks.json"]
```
