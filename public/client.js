const $ = (id) => document.getElementById(id);

const defaultOrder = {
  id: 'test-1234',
  payload: {participantId: '123456'}
};

// Load proto at runtime (no build step required for the demo)
const root = await protobuf.load('/proto/wrapper.proto');
const OrderWrapper = root.lookupType('demo.OrderWrapper');
const OrderTyped = root.lookupType('demo.OrderTyped');
const OrderResponse = root.lookupType('demo.OrderResponse');

function show(obj, el = $('res')) {
  el.textContent = JSON.stringify(obj, null, 2);
}

function showReq(obj) {
  $('req').textContent = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
}

$('btnJson').onclick = async () => {
  const payload = { ...defaultOrder };
  showReq(payload);

  const jsonStr = JSON.stringify(payload);

  const res = await fetch('/api/order-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: jsonStr
  });
  const data = await res.json();
  show(data);
  show(undefined, $('req-encoded'))
  show(undefined, $('res-encoded'))
};

$('btnProtoWrap').onclick = async () => {
  // Transitional: wrap legacy JSON inside protobuf bytes
  const legacy = { ...defaultOrder };
  showReq(legacy);

  const jsonStr = JSON.stringify(legacy);
  const jsonBytes = new TextEncoder().encode(jsonStr);

  // do not use json_payload, because The field naming rules of protobufjs are "underscores will be converted to camelCase by default when loading .proto".
  // create/encode will ignore it as an unknown field.
  const wrapper = OrderWrapper.create({
    version: 'v1-json-wrap',
    jsonPayload: jsonBytes,
  });
  const protoBytes = OrderWrapper.encode(wrapper).finish();

  const res = await fetch('/api/order-proto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-protobuf',
      'Accept': 'application/x-protobuf'
    },
    body: protoBytes
  });
  const buf = new Uint8Array(await res.arrayBuffer());
  const decoded = OrderResponse.decode(buf);

  show(decoded);
  show(protoBytes, $('req-encoded'))
  show(buf, $('res-encoded'))
};

$('btnProtoTyped').onclick = async () => {
  // Fully typed protobuf (JSON removed)
  const typed = OrderTyped.create({ ...defaultOrder });
  showReq(typed);

  const wrapper = OrderWrapper.create({
    version: 'v2-typed',
    typed
  });

  const protoBytes = OrderWrapper.encode(wrapper).finish();

  const res = await fetch('/api/order-proto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-protobuf',
      'Accept': 'application/x-protobuf'
    },
    body: protoBytes
  });

  const buf = new Uint8Array(await res.arrayBuffer());
  const decoded = OrderResponse.decode(buf);
  show(decoded);
  show(protoBytes, $('req-encoded'))
  show(buf, $('res-encoded'))
};
