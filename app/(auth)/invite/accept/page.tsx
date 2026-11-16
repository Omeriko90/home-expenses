import Link from "next/link";
import { auth } from "@/auth";
import { getInvitation } from "@/app/actions/invite";
import { getDictionary } from "@/lib/i18n/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInviteForm } from "@/components/features/settings/accept-invite-form";

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const t = await getDictionary();
  const session = await auth();
  const invitation = token ? await getInvitation(token) : null;

  if (session?.user) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl">{t.invite.title}</CardTitle>
          <CardDescription>{t.invite.loggedInNotice}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!invitation) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CardTitle className="text-xl">{t.invite.title}</CardTitle>
          <CardDescription>{t.invite.invalidInvite}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              {t.invite.backToLogin}
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <AcceptInviteForm
      token={token!}
      email={invitation.email}
      householdName={invitation.householdName}
    />
  );
}
