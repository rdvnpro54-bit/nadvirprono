
-- Update trigger to also assign admin role to specific email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create subscription
  INSERT INTO public.subscriptions (user_id, email, is_premium, plan)
  VALUES (NEW.id, NEW.email, false, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Auto-assign admin role for specific email
  IF NEW.email = 'rdvnpro54@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;
