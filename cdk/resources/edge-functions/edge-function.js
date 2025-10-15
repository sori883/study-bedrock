"use strict";
const crypto = require("crypto");
exports.handler = async (event, _ctx, cb) => {
  const req = event.Records[0].cf.request;
  if (!req.body || !req.body.data) return cb(null, req);
  const enc = req.body.encoding || "base64";
  let raw;
  if (enc === "base64") {
    raw = Buffer.from(req.body.data, "base64");
  } else {
    raw = Buffer.from(req.body.data, "utf8");
    req.body.data = raw.toString("base64");
    req.body.encoding = "base64";
  }
  const hashHex = crypto.createHash("sha256").update(raw).digest("hex");
  req.headers["x-amz-content-sha256"] = [{ key: "x-amz-content-sha256", value: hashHex }];
  return cb(null, req);
};