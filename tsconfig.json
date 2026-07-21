import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' });
    }
  }, [loading, user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Desconectado com sucesso!');
      navigate({ to: '/login' });
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Bem-vindo, {profile.full_name}!
          </h1>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seus Dados</CardTitle>
            <CardDescription>Informações da sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nome Completo</p>
                <p className="text-lg font-medium">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Data de Nascimento</p>
                <p className="text-lg font-medium">
                  {profile.date_of_birth
                    ? new Date(profile.date_of_birth).toLocaleDateString('pt-BR')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CPF</p>
                <p className="text-lg font-medium">{profile.cpf ?? '—'}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">Membro desde</p>
              <p className="text-lg font-medium">
                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Smooth Study Flow!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              Seus dados foram carregados automaticamente com sucesso. 
              Agora você está autenticado e pode acessar todas as funcionalidades do aplicativo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
