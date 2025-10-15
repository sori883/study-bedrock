function handler(event) {
  var req = event.request;
  if (req.headers && req.headers.host && req.headers.host.value) {
    req.headers['x-original-host'] = { value: req.headers.host.value };
  }
  return req;
}