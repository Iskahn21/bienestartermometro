import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { getFirestoreDb } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Lista de respaldo (correos que ya tenían cuenta antes del sistema dinámico)
const CORREOS_LEGACY = [
    'lcote@uniempresarial.edu.co',
    'lpenuela@uniempresarial.edu.co',
    'dmira@uniempresarial.edu.co',
    'lmena@uniempresarial.edu.co',
    'yramirezr@uniempresarial.edu.co',
    'drmelo@uniempresarial.edu.co'
];

async function esAdminAutorizado(correo: string): Promise<boolean> {
    if (CORREOS_LEGACY.includes(correo)) return true;
    try {
        const db = getFirestoreDb();
        const q = query(
            collection(db, 'usuarios'),
            where('correo_institucional', '==', correo),
            where('rol', '==', 'admin')
        );
        const snap = await getDocs(q);
        return !snap.empty;
    } catch {
        return false;
    }
}

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
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const correoNormalizado = correo.trim().toLowerCase();

        const autorizado = await esAdminAutorizado(correoNormalizado);
        if (!autorizado) {
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
        <>
            {/* Logo Uniempresarial — esquina superior izquierda */}
            <div className="logo-barra">
                <img src="/logo-uniempresarial.png" alt="Logo Uniempresarial" className="logo-img" />
            </div>

            <div className="login-admin-pagina">
                <div className="login-admin-contenedor">
                    <div className="login-admin-encabezado">
                        <h1 className="login-admin-titulo">Iniciar Sesión Administrador</h1>
                        <p className="login-admin-subtitulo">Acceso restringido para personal autorizado</p>
                    </div>

                    <div className="login-admin-tarjeta">
                        <form onSubmit={handleSubmit} className="login-admin-formulario">
                            <div>
                                <label className="login-admin-etiqueta">
                                    Correo Institucional <span className="texto-requerido">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    className="login-admin-input"
                                    placeholder="usuario@uniempresarial.edu.co"
                                    required
                                />
                            </div>

                            <div>
                                <label className="login-admin-etiqueta">
                                    Contraseña <span className="texto-requerido">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="login-admin-input"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loginMutation.isPending}
                                className="login-admin-boton"
                            >
                                {loginMutation.isPending ? 'Validando...' : 'Iniciar Sesión'}
                            </button>

                            <div className="login-admin-enlace-volver">
                                <Link to="/" className="login-admin-enlace-texto">
                                    Volver a la página principal
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
