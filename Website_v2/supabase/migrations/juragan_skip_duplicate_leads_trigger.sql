-- Trigger Otomatis: Skip Duplikat place_id pada b2b_leads
CREATE OR REPLACE FUNCTION public.fn_skip_duplicate_b2b_lead()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika place_id sudah ada di tabel b2b_leads, skip (jangan masukkan)
    IF NEW.place_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.b2b_leads 
        WHERE place_id = NEW.place_id AND (id <> NEW.id OR NEW.id IS NULL)
    ) THEN
        RETURN NULL; -- Otomatis SKIP dengan aman tanpa error
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger pada tabel b2b_leads
DROP TRIGGER IF EXISTS trg_skip_duplicate_b2b_lead ON public.b2b_leads;
CREATE TRIGGER trg_skip_duplicate_b2b_lead
BEFORE INSERT ON public.b2b_leads
FOR EACH ROW
EXECUTE FUNCTION public.fn_skip_duplicate_b2b_lead();
