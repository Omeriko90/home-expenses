"use client";

import { useI18n } from "@/lib/i18n/context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { PeoplePanel, type Invitation, type Member } from "./people-panel";

export type SettingsUser = {
  id: string;
  name: string;
  email: string;
  locale: string;
  role: "ADMIN" | "MEMBER";
};

export function SettingsView({
  user,
  householdName,
  members,
  invitations,
}: {
  user: SettingsUser;
  householdName: string;
  members: Member[];
  invitations: Invitation[];
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t.settings.profileTab}</TabsTrigger>
          <TabsTrigger value="password">{t.settings.passwordTab}</TabsTrigger>
          <TabsTrigger value="people">{t.settings.peopleTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <ProfileForm user={user} />
        </TabsContent>
        <TabsContent value="password" className="mt-4">
          <PasswordForm />
        </TabsContent>
        <TabsContent value="people" className="mt-4">
          <PeoplePanel
            currentUser={user}
            householdName={householdName}
            members={members}
            invitations={invitations}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
