import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import protobuf from 'protobufjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files and proto
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/proto', express.static(path.join(__dirname, 'proto')));

// JSON endpoint (legacy): accepts JSON, returns JSON
app.use('/api/order-json', express.json());
app.post('/api/order-json', (req, res) => {
  // Simulate real logic, map legacy JSON to a normalized typed shape
  const legacy = req.body || {};
  const typed = {
    id: String(legacy.id ?? ''),
    payload: {
      participantId: String(legacy.payload.participantId ?? '')
    },
  };
  res.json({ status: 'ok', message: 'JSON path', echoed: typed });
});

// Protobuf endpoint (migration): accepts application/x-protobuf (OrderWrapper), returns OrderResponse (protobuf)
app.post('/api/order-proto', express.raw({ type: 'application/x-protobuf', limit: '5mb' }), async (req, res) => {
  try {
    const root = await protobuf.load(path.join(__dirname, 'proto', 'wrapper.proto'));
    const OrderWrapper = root.lookupType('demo.OrderWrapper');
    const OrderTyped = root.lookupType('demo.OrderTyped');
    const OrderResponse = root.lookupType('demo.OrderResponse');

    const msg = OrderWrapper.decode(new Uint8Array(req.body));
    // Prefer typed if present; otherwise decode jsonPayload
    let typed = msg.typed;
    if (!typed || Object.keys(typed).length === 0) {
      if (msg.jsonPayload && msg.jsonPayload.length > 0) {
        try {
          const jsonStr = Buffer.from(msg.jsonPayload).toString('utf8');
          const legacy = JSON.parse(jsonStr);
          typed = OrderTyped.create({
            id: String(legacy.id ?? ''),
            payload: {
              participantId: String(legacy.payload.participantId ?? '')
            },
          });
        } catch (e) {
          typed = OrderTyped.create({ id: '', error: 'error' });
        }
      }
    }

    const payload = OrderResponse.create({
      status: 'ok',
      message: msg.version ? `proto path (${msg.version})` : 'proto path',
      echoed: typed
    });
    const bytes = OrderResponse.encode(payload).finish();
    res.set('Content-Type', 'application/x-protobuf');
    res.send(Buffer.from(bytes));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/', (_req, res) => {
  res.redirect('/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
