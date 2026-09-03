UPDATE public.photos SET location = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(location,
        ',?\s*(India|IN|Telangana|Maharashtra|Karnataka|Kerala|Rajasthan|Goa|Gujarat|Uttarakhand|Jammu|Kashmir|Ladakh|Himachal Pradesh|Assam|West Bengal|Tamil Nadu|Andhra Pradesh|Punjab|Haryana|Odisha|Bihar|Jharkhand|Chhattisgarh|Madhya Pradesh|Uttar Pradesh|Delhi|NCR)$',
        '', 'gi'
      ),
      ',?\s*(Telangana|TS|MH|KA|KL|RJ|GJ|UK|HP|AS|WB|TN|AP|PB|HR|OR|BR|JH|CG|MP|UP|DL)$',
      '', 'gi'
    ),
    '\s+', ' ', 'g'
  )
)
WHERE location IS NOT NULL;

UPDATE public.photos SET location = TRIM(BOTH ',' FROM location) WHERE location IS NOT NULL;
UPDATE public.photos SET location = TRIM(location) WHERE location IS NOT NULL;