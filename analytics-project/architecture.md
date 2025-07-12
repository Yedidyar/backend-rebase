New Architecture parts:

1. API Gateway that writes to a queue raw_views
2. Partitioner service that reads from the raw_views queue and partitions it between n queues raw_views_0->raw_views_n-1
3. Aggregator service per each n queue that reads from the queue and every 1000 messages/1 minutes (whichever comes first) aggregates the messages it got by pages and makes a request to the increments_service

What do we need?
Api gateway
raw*views queue (RabbitMQ)
page_views\*(0-n) (RabbitMQ)
partitioner service (reads from raw_views and writes to raw_views*(0-n))
aggregator\*(0-n) service that reads from raw*views*(0-n) and writes to the increments_service

Workload:
api gateway-Assaf
the API gateway has 3 routes
GET /report/{page}?now={now}&order={asc|desc}&take={1-24}
forwards requests as proxy to the anlytics service
POST /page-views/single/
parse to the multi schema and writes the payload to the raw_views queue
POST /page-views/multi/
writes the payload to the raw_views queue

and every request is queued to the raw_views queue
aggregator-Ariel
basically performs only /multi requests
partitioner-Yedidya
basically a queue load balancer to queues
deployment- Tomer
