import { expect } from "chai";
import request from "supertest";
import Payment from "../src/models/payment.model.js";
import Cart from "../src/models/cart.model.js";
import axios from "axios";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

describe("POST /payment", () => {
  let jwtStub, cartStub, axiosStub, paymentStub;

  beforeEach(() => {
    // Mock JWT
    jwtStub = sinon.stub(jwt, "verify").returns({ id: 1 });

    // Mock active cart (controller requires this)
    cartStub = sinon.stub(Cart, "findOne").resolves({
      _id: "cart123",
      currency: "MWK",
      status: "active",
      userId: 1,
    });

    // Mock PayChangu axios POST
    axiosStub = sinon.stub(axios, "post").resolves({
      data: { success: true, pay: "ok" }
    });

    // Mock Payment.create
    paymentStub = sinon.stub(Payment, "create").resolves({
      _id: "payment123",
      chargeId: "ABCDEFG",
    });
  });

  afterEach(() => {
    jwtStub.restore();
    cartStub.restore();
    axiosStub.restore();
    paymentStub.restore();
  });

  it("should create a payment successfully", async () => {
    
    const paymentRequest = {
      userId: 1,
      email: "test@test.com",
      name: "John",
      amount: 500,
      mobile: "0888888888",
      provider: "tnm"
    };

    const res = await request(app)
      .post("/api/payment/pay")
      .send(paymentRequest)
      .set("Cookie", ["token=fakejwt"]);

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Payment initiated");
  });
});
