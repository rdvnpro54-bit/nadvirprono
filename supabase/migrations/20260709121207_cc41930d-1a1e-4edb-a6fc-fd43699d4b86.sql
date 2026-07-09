
CREATE TABLE public.prediction_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id text NOT NULL,
  prediction_id text,
  engine_version text NOT NULL,
  model_version text,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  corrections jsonb,
  reason text,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_prediction_audit_log_match_id ON public.prediction_audit_log(match_id);
CREATE INDEX idx_prediction_audit_log_created_at ON public.prediction_audit_log(created_at DESC);
CREATE INDEX idx_prediction_audit_log_severity ON public.prediction_audit_log(severity);

GRANT SELECT ON public.prediction_audit_log TO authenticated;
GRANT ALL ON public.prediction_audit_log TO service_role;

ALTER TABLE public.prediction_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
ON public.prediction_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
