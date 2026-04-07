import { UserButton } from "@daveyplate/better-auth-ui";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import MaxWidthContainer from "~/lib/ui-utills";

export default function Home() {
  return (
    <MaxWidthContainer className="py-20">
      <div className="mt-2 flex w-full flex-wrap items-center justify-between gap-4">
        <Button asChild size="sm" variant="outline">
          <Link href="/convert">Codebase to document</Link>
        </Button>
        <UserButton />
      </div>
    </MaxWidthContainer>
  );
}
