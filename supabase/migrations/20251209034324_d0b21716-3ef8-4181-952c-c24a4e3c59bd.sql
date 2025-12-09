-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add update/delete policies for company-assets storage
CREATE POLICY "Authenticated users can update company assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'company-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete company assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'company-assets' AND auth.role() = 'authenticated');