import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { changePassword } from '../store/slices/authSlice';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const username = useSelector((state: RootState) => state.auth.username);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const error = useSelector((state: RootState) => state.auth.error);
  const dispatch = useDispatch<AppDispatch>();
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<PasswordChangeForm>();

  const onSubmit = async (data: PasswordChangeForm) => {
    try {
      const result = await dispatch(changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      })).unwrap();
      
      setMessage({ text: 'Пароль успешно изменен', type: 'success' });
      setIsChangingPassword(false);
      reset();
    } catch (error: any) {
      setMessage({ 
        text: error.response?.data?.message || 'Ошибка при смене пароля', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Профиль пользователя</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
        <div className="mb-6">
          <label className="text-sm text-gray-600">Имя пользователя</label>
          <div className="text-lg font-medium">{username}</div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div>
          {!isChangingPassword ? (
            <button
              onClick={() => {
                setIsChangingPassword(true);
                setMessage(null);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Изменить пароль
            </button>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Текущий пароль</label>
                <input
                  type="password"
                  {...register('currentPassword', { required: 'Введите текущий пароль' })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Новый пароль</label>
                <input
                  type="password"
                  {...register('newPassword', { 
                    required: 'Введите новый пароль',
                    minLength: { value: 6, message: 'Пароль должен быть не менее 6 символов' }
                  })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Подтвердите новый пароль</label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Подтвердите новый пароль',
                    validate: value => value === watch('newPassword') || 'Пароли не совпадают'
                  })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setMessage(null);
                    reset();
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 