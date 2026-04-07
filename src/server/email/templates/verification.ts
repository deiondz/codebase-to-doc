import { zeptomailClient } from "../config";

const VERIFICATION_RESET_TEMPLATE_KEY =
  "2518b.6cea1da7c86477e9.k1.b8227730-32b2-11f1-b104-62df313bf14d.19d69489e23";

const DEFAULT_FROM = {
  address: "noreply@codebase-to-doc.deiondz.in",
  name: "noreply",
};

export interface SendVerificationResetEmailParams {
  actionUrl: string;
  to: { email: string; name?: string };
}

export function sendVerificationResetEmail({
  to,
  actionUrl,
}: SendVerificationResetEmailParams) {
  return zeptomailClient.sendMailWithTemplate({
    template_key: VERIFICATION_RESET_TEMPLATE_KEY,
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
