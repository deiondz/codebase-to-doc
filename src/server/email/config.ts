import { SendMailClient } from "zeptomail";
import { env } from "~/env";

// For CommonJS
// var { SendMailClient } = require("zeptomail");

const url = "https://api.zeptomail.in/v1.1/email/template";
const token = env.ZEPTOMAIL_API_KEY;

export const zeptomailClient = new SendMailClient({ url, token });
