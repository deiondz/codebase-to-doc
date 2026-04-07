import { zeptomailClient } from "../config";

const PASSWORD_RESET_TEMPLATE_KEY =
  "2518b.6cea1da7c86477e9.k1.bd363590-32b2-11f1-8d40-525400c92439.19d6948bf69";

const DEFAULT_FROM = {
  address: "noreply@codebase-to-doc.deiondz.in",
  name: "noreply",
};

export interface SendPasswordResetEmailParams {
  to: { email: string; name?: string };
  actionUrl: string;
}

export function sendPasswordResetEmail({
  to,
  actionUrl,
}: SendPasswordResetEmailParams) {
  return zeptomailClient.sendMailWithTemplate({
    template_key: PASSWORD_RESET_TEMPLATE_KEY,
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
