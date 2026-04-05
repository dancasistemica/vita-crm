import UserProfileTab from '@/components/settings/UserProfileTab';

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-neutral-600 mt-1">Gerencie suas informações pessoais e configurações de conta</p>
      </div>
      <UserProfileTab />
    </div>
  );
}