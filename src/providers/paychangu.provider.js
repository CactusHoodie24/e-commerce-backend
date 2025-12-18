import axios from "axios"

export class PaychanguProvider {
  constructor(secret, apiUrl) {
    this.secret = secret
    this.apiUrl = apiUrl
  }

  async initiateMobileMoney({ operatorId, mobile, amount, chargeId, email, name, metadata }) {
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
}
