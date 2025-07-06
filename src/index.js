const express = require("express")
const app = express()
const port = process.env.PORT || 3000

app.get("/", (req, res) => {
  res.status(200).send("Hello from Express!")
})

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`)
})
