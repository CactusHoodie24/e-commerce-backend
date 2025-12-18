import { expect } from "chai";
import request from "supertest";
import sinon from "sinon";
import jwt from "jsonwebtoken";
import axios from "axios";
import mongoose from "mongoose";

import app from "../src/app.js";
import Cart from "../src/models/cart.model.js";
import { PaymentRepository } from "../src/lib/payment.repository.js";

describe("POST /payment", () => {
  let jwtStub;
  let cartStub;
  let axiosStub;
  let paymentRepoStub;

  const userObjectId = new mongoose.Types.ObjectId();
  const cartObjectId = new mongoose.Types.ObjectId();
  const paymentObjectId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    // 🔐 Mock JWT auth (match real ObjectId)
    jwtStub = sinon.stub(jwt, "verify").returns({
      id: userObjectId.toString(),
    });

    // 🛒 Mock active cart lookup
    cartStub = sinon.stub(Cart, "findOne").resolves({
      _id: cartObjectId,
      userId: userObjectId,
      currency: "MWK",
      status: "active",
    });

    // 💳 Mock PayChangu API call
    axiosStub = sinon.stub(axios, "post").resolves({
      data: { success: true, pay: "ok" },
    });

    // 💾 Mock repository save (NOT Mongoose model)
    paymentRepoStub = sinon
      .stub(PaymentRepository.prototype, "save")
      .resolves({
        _id: paymentObjectId,
        userId: userObjectId,
        cartId: cartObjectId,
        chargeId: "ABCDEFG",
        status: "pending",
      });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should create a payment successfully", async () => {
    const paymentRequest = {
      userId: userObjectId.toString(),
      email: "test@test.com",
      name: "John",
      amount: 500,
      mobile: "0888888888",
      provider: "tnm",
    };

    const res = await request(app)
      .post("/api/payment/pay")
      .send(paymentRequest)
      .set("Cookie", ["token=fakejwt"]);

    // ✅ Assertions
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal("Payment initiated");
    expect(res.body.paymentId).to.exist;
    expect(res.body.chargeId).to.equal("ABCDEFG");
  });
});
