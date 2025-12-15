import sinon from "sinon";
import { expect } from "chai";
import request from "supertest";
import Cart from "../src/models/cart.model.js";
import app from "../src/app.js";
import jwt from "jsonwebtoken";

describe("GET /api/cart/:userId", () => {
  let findOneStub;

  before(() => {
    // Bypass authentication
   sinon.stub(jwt, "verify").callsFake((token, secret) => ({ id: 1 }));

    // Stub DB
    findOneStub = sinon.stub(Cart, "findOne");
  });

  after(() => {
    findOneStub.restore();
    sinon.restore(); // restore all stubs
  });

  it("should retrieve cart details for user", async () => {
    const fakeCart = {
      items: ["sugar", "beans", "soya"],
      totalamount: 5000,
      currency: "MWK"
    };

    findOneStub.resolves(fakeCart);

    const res = await request(app).get("/api/cart/1").set("Cookie", ["token=fakejwt123"]);;

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(fakeCart);
  });
});
