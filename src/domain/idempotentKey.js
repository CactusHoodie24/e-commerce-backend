class Idempotency {
    constructor({
      key,
      userId,
      requestHash,
      status = "IN_PROGRESS",
      responseBody = null,
      responseCode = null,
      paymentId = null,
      createdAt = new Date(),
      expiresAt,
    }) {
      if (!key) throw new Error("Idempotency key is required");
      if (!userId) throw new Error("UserId is required");
      if (!requestHash) throw new Error("Request hash is required");
      if (!expiresAt) throw new Error("Expiration date is required");
  
      this.key = key;
      this.userId = userId;
      this.requestHash = requestHash;
      this.status = status;
      this.responseBody = responseBody;
      this.responseCode = responseCode;
      this.paymentId = paymentId;
      this.createdAt = createdAt;
      this.expiresAt = expiresAt;
  
      this._validateState();
    }
  
    // 🔒 Domain invariant enforcement
    _validateState() {
      if (this.status === "IN_PROGRESS") {
        if (this.responseBody || this.responseCode || this.paymentId) {
          throw new Error("IN_PROGRESS cannot have response data");
        }
      }
  
      if (this.status === "SUCCESS") {
        if (!this.responseBody || !this.responseCode || !this.paymentId) {
          throw new Error("SUCCESS requires responseBody, responseCode and paymentId");
        }
      }
  
      if (this.status === "FAILED") {
        if (!this.responseCode) {
          throw new Error("FAILED requires responseCode");
        }
      }
    }
  
    // 🔁 Transition to SUCCESS
    markSuccess({ responseBody, responseCode, paymentId }) {
      if (this.status !== "IN_PROGRESS") {
        throw new Error("Only IN_PROGRESS can transition to SUCCESS");
      }
  
      if (!responseBody || !responseCode || !paymentId) {
        throw new Error("SUCCESS requires responseBody, responseCode and paymentId");
      }
  
      this.status = "SUCCESS";
      this.responseBody = responseBody;
      this.responseCode = responseCode;
      this.paymentId = paymentId;
  
      this._validateState();
    }
  
    // 🔁 Transition to FAILED
    markFailure({ responseBody = null, responseCode }) {
      if (this.status !== "IN_PROGRESS") {
        throw new Error("Only IN_PROGRESS can transition to FAILED");
      }
  
      if (!responseCode) {
        throw new Error("FAILED requires responseCode");
      }
  
      this.status = "FAILED";
      this.responseBody = responseBody;
      this.responseCode = responseCode;
  
      this._validateState();
    }
  
    // 🧠 Utility
    isTerminal() {
      return ["SUCCESS", "FAILED"].includes(this.status);
    }
  
    isExpired() {
      return new Date() > this.expiresAt;
    }
  }
  
  export default Idempotency;
  