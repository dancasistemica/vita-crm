-- Fix overly permissive organization creation policy
DROP POLICY IF EXISTS "Auth users can create orgs" ON public.organizations;
CREATE POLICY "Users can create their own org" 
ON public.organizations 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = owner_id);

-- Fix overly permissive logo storage policies
-- First, drop the existing ones
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;

-- Create new restricted policies for the 'logos' bucket
CREATE POLICY "Owners and admins can upload logos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'logos' AND 
    (
        SELECT role 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = (storage.foldername(name))[1]::uuid
    ) IN ('owner', 'admin')
);

CREATE POLICY "Owners and admins can update logos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'logos' AND 
    (
        SELECT role 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = (storage.foldername(name))[1]::uuid
    ) IN ('owner', 'admin')
);

CREATE POLICY "Owners and admins can delete logos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'logos' AND 
    (
        SELECT role 
        FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = (storage.foldername(name))[1]::uuid
    ) IN ('owner', 'admin')
);