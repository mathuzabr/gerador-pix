import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import pino from "pino-http";
import exphbs from "express-handlebars";
import QRCode from "qrcode";
import BrCode from "./lib/br_code.js";

const app = express();

app.use(helmet());
app.use(pino());
app.use(bodyParser.json());
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

const port = process.env.PORT || 8081;
const QR_CODE_SIZE = 400;
const article_links = [];

const contentSecurityPolicy = [
  "script-src 'self' 'nonce-2726c7f26c' www.googletagmanager.com pagead2.googlesyndication.com",
].join(";");

app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", contentSecurityPolicy);
  next();
});

app.get("/", function (req, res) {
  res.json({
    message: "Welcome to generate pix server!",
  });
});

app.post("/emvqr-static", (req, res) => {
  var { key, amount, name, reference, key_type, city } = req.body;

  if (key) {
    var brCode = new BrCode(key, amount, name, reference, key_type, city);

    var code = brCode.generate_qrcp();

    QRCode.toDataURL(code, { width: QR_CODE_SIZE, height: QR_CODE_SIZE })
      .then((qrcode) => {
        res.json({
          qrcode_base64: qrcode,
          code: code,
          key_type: brCode.key_type,
          key: brCode.key,
          amount: brCode.amount,
          name: brCode.name,
          city: brCode.city,
          reference: brCode.reference,
          formated_amount: brCode.formated_amount(),
        });
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    res.status(422);
    res.json({ error: "Campo Key não presente" });
  }
});

app.listen(port, () => {
  console.log(`Starting generate pix server on port ${port}!`);
});
