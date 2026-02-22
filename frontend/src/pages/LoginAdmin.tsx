import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

const CORREOS_PERMITIDOS = [
    'lcote@uniempresarial.edu.co',
    'lpenuela@uniempresarial.edu.co',
    'dmira@uniempresarial.edu.co',
    'lmena@uniempresarial.edu.co',
    'yramirezr@uniempresarial.edu.co',
    'drmelo@uniempresarial.edu.co'
];

export function LoginAdminPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuthStore();
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const loginMutation = useMutation({
        mutationFn: () => authService.login(correo, password),
        onSuccess: (data) => {
            login(data.access_token, data.usuario);
            toast.success('¡Bienvenido Administrador!');

            // Redirigir a la vista principal donde está la tarjeta de Administrador
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const correoNormalizado = correo.trim().toLowerCase();

        // Validación estricta solicitada de correos y contraseña
        if (!CORREOS_PERMITIDOS.includes(correoNormalizado)) {
            toast.error('Acceso denegado: Correo no autorizado.');
            return;
        }

        if (password !== 'Bienestar@2026') {
            toast.error('Credenciales incorrectas.');
            return;
        }

        loginMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Iniciar Sesión Administrador</h1>
                    <p className="text-gray-600 mt-2">Acceso restringido para personal autorizado</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Correo Institucional <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="usuario@uniempresarial.edu.co"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                        >
                            {loginMutation.isPending ? 'Validando...' : 'Iniciar Sesión'}
                        </button>

                        <div className="text-center mt-4">
                            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 underline">
                                Volver a la página principal
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
