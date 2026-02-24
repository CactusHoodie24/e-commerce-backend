import Idempotency from "../domain/idempotentKey.js";

export default class IdempotencyRepository {
  constructor(model) {
    this.model = model;
  }

  // 1️⃣ Strict create — no upsert
  async createIntent(domainObj) {
    try {
      const doc = await this.model.create({
        key: domainObj.key,
        userId: domainObj.userId,
        requestHash: domainObj.requestHash,
        status: domainObj.status,
        expiresAt: domainObj.expiresAt,
        responseBody: domainObj.responseBody,
        responseCode: domainObj.responseCode,
        paymentId: domainObj.paymentId,
      });

      return new Idempotency(doc.toObject());

    } catch (err) {
      if (err.code === 11000) {
        // duplicate key error from unique index
        throw new Error("IDEMPOTENCY_ALREADY_EXISTS");
      }
      throw err;
    }
  }

  // 2️⃣ Save existing only
  async save(domainObj) {
    const doc = await this.model.findOne({
      key: domainObj.key,
      userId: domainObj.userId,
    });

    if (!doc) {
      throw new Error("Cannot update non-existing idempotency record");
    }

    // Only update allowed fields
    doc.status = domainObj.status;
    doc.responseBody = domainObj.responseBody;
    doc.responseCode = domainObj.responseCode;
    doc.paymentId = domainObj.paymentId;

    await doc.save();

    return new Idempotency(doc.toObject());
  }

  // 3️⃣ Read
  async findByKey(key, userId) {
    const doc = await this.model.findOne({ key, userId });
    if (!doc) return null;

    return new Idempotency(doc.toObject());
  }
}
