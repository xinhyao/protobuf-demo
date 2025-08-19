# JSON → Protobuf Transitional Migration Demo

This project demonstrates a practical, incremental approach to migrate from JSON payloads to Protocol Buffers in a web app:

1) **Legacy JSON**: `/api/order-json` (request/response are JSON)
2) **Proto wrapper**: `/api/order-proto` (request is protobuf `OrderWrapper`, which can carry legacy JSON in `json_payload`)
3) **Fully typed proto**: gradually fill the `typed` message and remove the JSON

## Run

```bash
npm install
npm start
# open http://localhost:3000
```

Click the three buttons to compare:
- JSON (legacy)
- Protobuf (JSON wrapped inside)
- Protobuf (fully typed)

The page prints request/response and size comparison.
