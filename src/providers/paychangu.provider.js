import axios from "axios"

export class PaychanguProvider {
  constructor(secret, apiUrl) {
    this.secret = secret
    this.apiUrl = apiUrl
  }

  async initiateMobileMoney({ operatorId, mobile, amount, chargeId, email, name, metadata }) {
    try {
      const response = await axios.post(
      this.apiUrl,
      {
        mobile_money_operator_ref_id: operatorId,
        mobile,
        amount: amount.toString(),
        charge_id: chargeId,
        email,
        first_name: name,
        last_name: name,
        metadata
      },
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
          "Content-Type": "application/json"
        }
      }
    )
    return response.data
    }catch(error) {
      console.log("Status:", error.response?.status)
  console.log("Data:", error.response?.data)
  throw error
    }
  }

  async initiateBankTransfer({ amount, currency, chargeId }) {
    try {
      const response = await axios.post(
        "https://api.paychangu.com/direct-charge/payments/initialize",
        {
          payment_method: "mobile_bank_transfer",
          amount: amount.toString(),
          currency,
          charge_id: chargeId,
          create_permanent_account: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secret}`,
            accept: "application/json",
            "Content-Type": "application/json"
          }
        }
      )

      return response.data
    } catch (error) {
      console.log("Status:", error.response?.status)
      console.log("Data:", error.response?.data)
      throw error
    }
  }

  async verify(chargeId) {
    const response = await axios.get(
      `https://api.paychangu.com/verify-payment/${chargeId}`,
      {
        headers: {
          Authorization: `Bearer ${this.secret}`
        }
      }
    )

    return response.data
  }

  async verifyMobileMoney(chargeId) {
    const response = await axios.get(
      `https://api.paychangu.com/mobile-money/payments/${encodeURIComponent(chargeId)}/verify`,
      {
        headers: {
          Authorization: `Bearer ${this.secret}`,
          accept: "application/json",
          "Content-Type": "application/json"
        }
      }
    )

    return response.data
  }
}
