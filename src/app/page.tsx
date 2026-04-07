import { UserButton } from "@daveyplate/better-auth-ui";
import MaxWidthContainer from "~/lib/ui-utills";

export default function Home() {
  return (
    <MaxWidthContainer className="py-20">
      <div className="mt-2 flex w-full justify-end">
        <UserButton />
      </div>
    </MaxWidthContainer>
  );
}
