import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { UserPlus, Check, X, Shield, User as UserIcon } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    const confirmed = window.confirm('Tem certeza que deseja rejeitar este usuário? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      // Delete user record
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_super_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="p-6 space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => !u.is_approved);
  const approvedUsers = users.filter(u => u.is_approved);

  return (
    <div className="space-y-6">
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Solicitações Pendentes ({pendingUsers.length})
            </h3>
          </div>

          <div className="p-6 space-y-4">
            {pendingUsers.map((pendingUser) => (
              <div
                key={pendingUser.id}
                className="border border-orange-200 bg-orange-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{pendingUser.full_name}</h4>
                      <p className="text-sm text-gray-600">{pendingUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveUser(pendingUser.id)}
                      className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprovar</span>
                    </button>
                    <button
                      onClick={() => handleRejectUser(pendingUser.id)}
                      className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Rejeitar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Usuários Aprovados ({approvedUsers.length})
          </h3>
        </div>

        <div className="p-6">
          {approvedUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário aprovado ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedUsers.map((approvedUser) => (
                <div
                  key={approvedUser.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        approvedUser.is_super_admin 
                          ? 'bg-purple-100' 
                          : 'bg-blue-100'
                      }`}>
                        {approvedUser.is_super_admin ? (
                          <Shield className="w-5 h-5 text-purple-600" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {approvedUser.full_name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{approvedUser.email}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            approvedUser.is_super_admin
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {approvedUser.is_super_admin ? 'Super Admin' : 'Integrante'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleAdmin(approvedUser.id, approvedUser.is_super_admin)}
                      className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                        approvedUser.is_super_admin
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      {approvedUser.is_super_admin ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}