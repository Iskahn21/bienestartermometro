import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authService } from '../services/authService';


const esquemaRegistro = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  tipo_documento: z.enum(['CC', 'TI']),
  numero_documento: z.string().min(10, 'Mínimo 10 dígitos'),
  correo_institucional: z.string()
    .email('Correo inválido')
    .endsWith('@uniempresarial.edu.co', 'Debe ser correo institucional (@uniempresarial.edu.co)'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[a-z]/, 'Debe contener minúscula')
    .regex(/[0-9]/, 'Debe contener número'),
  confirmar_password: z.string(),
  programa: z.string().optional(),
  cargo: z.string().min(1, 'Selecciona un cargo'),
  promocion: z.string().optional(),
  consent_accepted: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar el consentimiento para registrarte'
  }),
  can_contact: z.boolean()
}).refine((data) => data.password === data.confirmar_password, {
  message: "Las contraseñas no coinciden",
  path: ["confirmar_password"]
});

type FormData = z.infer<typeof esquemaRegistro>;

export function RegistroColaboradorPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Consentimiento, 2: Formulario

  const CARGOS_COLABORADOR = [
    'Coordinador',
    'Director',
    'Jefe',
    'Asistente',
    'Rector',
    'Profesional',
    'Administrativo',
  ];

  const registroMutation = useMutation({
    mutationFn: authService.registrarColaborador,
    onSuccess: () => {
      toast.success('¡Registro exitoso! Ya puedes iniciar sesión');
      navigate('/login');
    },
    onError: (error: any) => {
      const msg = error?.message || error?.response?.data?.detail || 'Error al registrar';
      let mensajeAmigable = msg;
      if (msg.includes('email-already-in-use')) mensajeAmigable = 'Este correo ya está registrado.';
      else if (msg.includes('weak-password')) mensajeAmigable = 'La contraseña es muy débil.';
      else if (msg.includes('invalid-email')) mensajeAmigable = 'El correo no es válido.';
      toast.error(mensajeAmigable);
    }
  });

  const { register, handleSubmit, trigger, watch, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: {
      consent_accepted: false,
      can_contact: false
    },
    mode: 'onChange'
  });

  const consent_accepted = watch('consent_accepted');

  const handleNextStep = async () => {
    const isConsentValid = await trigger('consent_accepted');
    if (isConsentValid) {
      if (!consent_accepted) {
        toast.error('Debes aceptar el consentimiento para continuar');
        return;
      }
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = (data: FormData) => {
    registroMutation.mutate({
      nombres: data.nombres,
      apellidos: data.apellidos,
      tipo_documento: data.tipo_documento,
      numero_documento: data.numero_documento,
      correo_institucional: data.correo_institucional,
      password: data.password,
      cargo: data.cargo,
      consent_accepted: data.consent_accepted,
      can_contact: data.can_contact,
    });
  };

  // Step 1: Consentimiento
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Consentimiento Informado
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Por favor lee atentamente y acepta para continuar con el registro.
            </p>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
            <div className="prose prose-blue max-w-none mb-6 text-gray-700 h-96 overflow-y-auto border p-4 rounded-md bg-gray-50">
              <p>El presente cuestionario corresponde al Índice de Bienestar WHO-5, un instrumento breve de tamizaje desarrollado por la Organización Mundial de la Salud, cuyo propósito es explorar de manera general el nivel de bienestar emocional durante las últimas dos semanas en el marco de su experiencia académica y personal.</p>
              <p className="mt-2">La participación en este tamizaje es voluntaria. La información recolectada será tratada con estricta confidencialidad y utilizada exclusivamente con fines preventivos, psicoeducativos y de orientación, en el marco de las acciones del área de Bienestar Universitario. Este instrumento no genera diagnóstico psicológico ni psiquiátrico, ni reemplaza una valoración clínica individual.</p>
              <p className="mt-2">Usted puede decidir no participar o retirarse en cualquier momento, sin que ello implique consecuencias académicas, laborales, evaluativas o administrativas. En caso de que las respuestas indiquen posibles alertas en el bienestar emocional, el área de Bienestar Universitario podrá ofrecer orientación y remitir, si usted lo autoriza, a rutas básicas de atención y acompañamiento psicológico, respetando siempre su autonomía y dignidad.</p>
              <p className="mt-2 font-semibold">Al continuar con el diligenciamiento del cuestionario, usted declara que:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Ha leído y comprendido la información suministrada.</li>
                <li>Acepta participar de manera libre, voluntaria e informada.</li>
                <li>Autoriza el uso ético, confidencial y anónimo de la información con fines institucionales de bienestar y prevención.</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('consent_accepted')}
                    id="consent_accepted"
                    type="checkbox"
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="consent_accepted" className="font-medium text-gray-700">
                    He leído y acepto el consentimiento informado <span className="text-red-500">*</span>
                  </label>
                  {errors.consent_accepted && (
                    <p className="text-red-600 mt-1">{errors.consent_accepted.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('can_contact')}
                    id="can_contact"
                    type="checkbox"
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="can_contact" className="font-medium text-gray-700">
                    Autorizo a Bienestar Universitario a contactarme si mi puntaje indica alerta
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4 mt-6">
                <Link
                  to="/"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registro de Colaborador</h1>
          <p className="text-gray-600 mt-2">Crea tu cuenta para acceder al sistema</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Nombres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombres <span className="text-red-500">*</span>
              </label>
              <input
                {...register('nombres')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Juan Carlos"
              />
              {errors.nombres && (
                <p className="mt-1 text-sm text-red-600">{errors.nombres.message}</p>
              )}
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos <span className="text-red-500">*</span>
              </label>
              <input
                {...register('apellidos')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Pérez García"
              />
              {errors.apellidos && (
                <p className="mt-1 text-sm text-red-600">{errors.apellidos.message}</p>
              )}
            </div>

            {/* Documento */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('tipo_documento')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tipo</option>
                  <option value="CC">CC</option>
                  <option value="TI">TI</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('numero_documento')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="1234567890"
                />
              </div>
            </div>
            {errors.numero_documento && (
              <p className="mt-1 text-sm text-red-600">{errors.numero_documento.message}</p>
            )}

            {/* Correo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Institucional <span className="text-red-500">*</span>
              </label>
              <input
                {...register('correo_institucional')}
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="juan.perez@uniempresarial.edu.co"
              />
              {errors.correo_institucional && (
                <p className="mt-1 text-sm text-red-600">{errors.correo_institucional.message}</p>
              )}
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo <span className="text-red-500">*</span>
              </label>
              <select
                {...register('cargo')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona tu cargo</option>
                {CARGOS_COLABORADOR.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.cargo && (
                <p className="mt-1 text-sm text-red-600">{errors.cargo.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo 8 caracteres, incluye mayúscula, minúscula y número
              </p>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                {...register('confirmar_password')}
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.confirmar_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmar_password.message}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 text-center"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={!isValid || registroMutation.isPending}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {registroMutation.isPending ? 'Registrando...' : 'Registrarse'}
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Inicia sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
