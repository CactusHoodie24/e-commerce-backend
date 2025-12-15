import { expect } from "chai";
import request from "supertest";
import sinon from "sinon";
import Payment from "../src/models/payment.model.js";
import app from "../src/app.js";
import crypto from "crypto";


describe("webhook /paychangu", () => {
  const secret = "124564747";
  before(() => {
    process.env.PAYCHANGU_WEBHOOK_SECRET = secret;
  });
  afterEach(() => {
    sinon.restore();
  });

  it("it should accept webhook with valid signature", async () => {
    const payload = {
      chargeId: "12345",
      status: "success",
    };

    const rawBody = JSON.stringify(payload);

    const signature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    sinon.stub(Payment, "findOneAndUpdate").resolves(payload);

    const res = await request(app)
      .post("/webhook/paychangu")
      .send(rawBody)
      .set("signature", signature)
      .set("Content-Type", "application/json");

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ success: true });
    expect(Payment.findOneAndUpdate.calledOnce).to.be.true;
  });

  it("❌ should reject webhook with invalid signature", async () => {
    const payload = {
      charge_id: "chg_123",
      status: "failed",
    };

    const rawBody = JSON.stringify(payload);

    const res = await request(app)
      .post("/webhook/paychangu")
      .set("signature", "invalid_signature")
      .set("Content-Type", "application/json")
      .send(rawBody);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal("Invalid signature");
  });

  it("💥 should return 500 if database update fails", async () => {
    const payload = {
      charge_id: "chg_456",
      status: "success",
    };

    const rawBody = JSON.stringify(payload);

    const signature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    sinon.stub(Payment, "findOneAndUpdate").throws(new Error("DB failure"));

    const res = await request(app)
      .post("/webhook/paychangu")
      .set("signature", signature)
      .set("Content-Type", "application/json")
      .send(rawBody);

    expect(res.status).to.equal(500);
    expect(res.body.message).to.equal("Webhook error");
  });
});
