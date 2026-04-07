import { zeptomailClient } from "../config";

const MAGIC_LINK_TEMPLATE_KEY =
  "2518b.6cea1da7c86477e9.k1.b3becef0-32b2-11f1-ada5-cabf48e1bf81.19d6948815f";

const DEFAULT_FROM = {
  address: "noreply@codebase-to-doc.deiondz.in",
  name: "noreply",
};

export interface SendMagicLinkEmailParams {
  actionUrl: string;
  to: { email: string; name?: string };
}

export function sendMagicLinkEmail({
  to,
  actionUrl,
}: SendMagicLinkEmailParams) {
  return zeptomailClient.sendMailWithTemplate({
    template_key: MAGIC_LINK_TEMPLATE_KEY,
    from: { ...DEFAULT_FROM },
    to: [
      {
        email_address: {
          address: to.email,
          name: to.name ?? "",
        },
      },
    ],
    merge_info: { action_url: actionUrl },
  });
}
