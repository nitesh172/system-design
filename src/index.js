const express = require("express")
const app = express()
const port = process.env.PORT || 3000
const http = require("http") // using http, not https
const os = require("os")

app.get("/", async (req, res) => {
  const isEC2 = process.env.EC2_METADATA_DISABLED !== "true" // allow manual override
  console.log(isEC2)
  const getToken = () => {
    return new Promise((resolve, reject) => {
      const options = {
        method: "PUT",
        host: "169.254.169.254",
        path: "/latest/api/token",
        headers: {
          "X-aws-ec2-metadata-token-ttl-seconds": "21600",
        },
        timeout: 1000,
      }

      const reqToken = http.request(options, (resToken) => {
        let data = ""
        resToken.on("data", (chunk) => (data += chunk))
        resToken.on("end", () => resolve(data))
      })

      reqToken.on("error", () => resolve(null)) // fallback if error
      reqToken.end()
    })
  }

  const getInstanceId = (token) => {
    return new Promise((resolve, reject) => {
      const options = {
        method: "GET",
        host: "169.254.169.254",
        path: "/latest/meta-data/instance-id",
        headers: token ? { "X-aws-ec2-metadata-token": token } : {},
        timeout: 1000,
      }

      const reqId = http.request(options, (resId) => {
        let data = ""
        resId.on("data", (chunk) => (data += chunk))
        resId.on("end", () => resolve(data))
      })

      reqId.on("error", () => resolve(null)) // fallback
      reqId.end()
    })
  }

  let instanceId = "local-dev1"
  if (isEC2) {
    try {
      const token = await getToken()
      const id = await getInstanceId(token)
      if (id) instanceId = id
    } catch (_) {
      instanceId = "metadata-unavailable"
    }
  }

  res.status(200).json({
    message: "Request served successfully",
    instanceId,
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
  })
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`)
})
