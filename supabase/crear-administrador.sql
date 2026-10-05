-- Asigna el rol de administrador principal en Pacotizar.
-- Ejecutar desde Supabase > SQL Editor, después de registrar esta cuenta.

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id
  INTO admin_user_id
  FROM auth.users
  WHERE lower(email) = lower('jesgondres10@gmail.com');

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No existe una cuenta de Supabase Auth con ese correo. Regístrate primero en Pacotizar y vuelve a ejecutar este script.';
  END IF;

  INSERT INTO public.administradores_plataforma (profile_id, activo)
  VALUES (admin_user_id, true)
  ON CONFLICT (profile_id) DO UPDATE
  SET activo = true;

  INSERT INTO public.perfiles (id, nombre, rol)
  VALUES (admin_user_id, 'Jorge Escobar', 'administrator')
  ON CONFLICT (id) DO UPDATE
  SET nombre = EXCLUDED.nombre,
      rol = EXCLUDED.rol,
      updated_at = now();

  RAISE NOTICE 'Administrador principal activado para jesgondres10@gmail.com.';
END;
$$;
