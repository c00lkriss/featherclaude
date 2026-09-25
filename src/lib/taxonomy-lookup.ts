import { supabase } from "@/integrations/supabase/client";

// Compact IOC taxonomy lookup — order and family by genus.
const GENUS_TAXONOMY: Record<string, { 
  order: string; family: string 
}> = {
  // Passeriformes
  "Passer": { order: "Passeriformes", family: "Passeridae" },
  "Sturnus": { order: "Passeriformes", family: "Sturnidae" },
  "Acridotheres": { order: "Passeriformes", family: "Sturnidae" },
  "Gracula": { order: "Passeriformes", family: "Sturnidae" },
  "Turdus": { order: "Passeriformes", family: "Turdidae" },
  "Copsychus": { order: "Passeriformes", family: "Muscicapidae" },
  "Saxicola": { order: "Passeriformes", family: "Muscicapidae" },
  "Muscicapa": { order: "Passeriformes", family: "Muscicapidae" },
  "Ficedula": { order: "Passeriformes", family: "Muscicapidae" },
  "Monticola": { order: "Passeriformes", family: "Muscicapidae" },
  "Enicurus": { order: "Passeriformes", family: "Muscicapidae" },
  "Luscinia": { order: "Passeriformes", family: "Muscicapidae" },
  "Calliope": { order: "Passeriformes", family: "Muscicapidae" },
  "Phoenicurus": { order: "Passeriformes", family: "Muscicapidae" },
  "Cyornis": { order: "Passeriformes", family: "Muscicapidae" },
  "Niltava": { order: "Passeriformes", family: "Muscicapidae" },
  "Rhipidura": { order: "Passeriformes", family: "Rhipiduridae" },
  "Dicrurus": { order: "Passeriformes", family: "Dicruridae" },
  "Oriolus": { order: "Passeriformes", family: "Oriolidae" },
  "Corvus": { order: "Passeriformes", family: "Corvidae" },
  "Dendrocitta": { order: "Passeriformes", family: "Corvidae" },
  "Urocissa": { order: "Passeriformes", family: "Corvidae" },
  "Garrulus": { order: "Passeriformes", family: "Corvidae" },
  "Pycnonotus": { order: "Passeriformes", family: "Pycnonotidae" },
  "Iole": { order: "Passeriformes", family: "Pycnonotidae" },
  "Hypsipetes": { order: "Passeriformes", family: "Pycnonotidae" },
  "Prinia": { order: "Passeriformes", family: "Cisticolidae" },
  "Cisticola": { order: "Passeriformes", family: "Cisticolidae" },
  "Phylloscopus": { order: "Passeriformes", family: "Phylloscopidae" },
  "Abroscopus": { order: "Passeriformes", family: "Cettiidae" },
  "Cettia": { order: "Passeriformes", family: "Cettiidae" },
  "Acrocephalus": { order: "Passeriformes", family: "Acrocephalidae" },
  "Sylvia": { order: "Passeriformes", family: "Sylviidae" },
  "Turdoides": { order: "Passeriformes", family: "Leiothrichidae" },
  "Argya": { order: "Passeriformes", family: "Leiothrichidae" },
  "Garrulax": { order: "Passeriformes", family: "Leiothrichidae" },
  "Leiothrix": { order: "Passeriformes", family: "Leiothrichidae" },
  "Pellorneum": { order: "Passeriformes", family: "Pellorneidae" },
  "Timalia": { order: "Passeriformes", family: "Timaliidae" },
  "Sitta": { order: "Passeriformes", family: "Sittidae" },
  "Parus": { order: "Passeriformes", family: "Paridae" },
  "Machlolophus": { order: "Passeriformes", family: "Paridae" },
  "Periparus": { order: "Passeriformes", family: "Paridae" },
  "Hirundo": { order: "Passeriformes", family: "Hirundinidae" },
  "Cecropis": { order: "Passeriformes", family: "Hirundinidae" },
  "Riparia": { order: "Passeriformes", family: "Hirundinidae" },
  "Delichon": { order: "Passeriformes", family: "Hirundinidae" },
  "Motacilla": { order: "Passeriformes", family: "Motacillidae" },
  "Anthus": { order: "Passeriformes", family: "Motacillidae" },
  "Fringilla": { order: "Passeriformes", family: "Fringillidae" },
  "Carpodacus": { order: "Passeriformes", family: "Fringillidae" },
  "Pyrrhula": { order: "Passeriformes", family: "Fringillidae" },
  "Carduelis": { order: "Passeriformes", family: "Fringillidae" },
  "Emberiza": { order: "Passeriformes", family: "Emberizidae" },
  "Lonchura": { order: "Passeriformes", family: "Estrildidae" },
  "Amandava": { order: "Passeriformes", family: "Estrildidae" },
  "Nectarinia": { order: "Passeriformes", family: "Nectariniidae" },
  "Aethopyga": { order: "Passeriformes", family: "Nectariniidae" },
  "Cinnyris": { order: "Passeriformes", family: "Nectariniidae" },
  "Leptocoma": { order: "Passeriformes", family: "Nectariniidae" },
  "Dicaeum": { order: "Passeriformes", family: "Dicaeidae" },
  "Lanius": { order: "Passeriformes", family: "Laniidae" },
  "Tephrodornis": { order: "Passeriformes", family: "Vangidae" },
  "Aegithina": { order: "Passeriformes", family: "Chloropseidae" },
  "Chloropsis": { order: "Passeriformes", family: "Chloropseidae" },
  "Artamus": { order: "Passeriformes", family: "Artamidae" },
  "Pericrocotus": { order: "Passeriformes", family: "Campephagidae" },
  "Coracina": { order: "Passeriformes", family: "Campephagidae" },
  "Irena": { order: "Passeriformes", family: "Irenidae" },
  "Troglodytes": { order: "Passeriformes", family: "Troglodytidae" },
  // Columbiformes
  "Columba": { order: "Columbiformes", family: "Columbidae" },
  "Streptopelia": { order: "Columbiformes", family: "Columbidae" },
  "Spilopelia": { order: "Columbiformes", family: "Columbidae" },
  "Treron": { order: "Columbiformes", family: "Columbidae" },
  "Ducula": { order: "Columbiformes", family: "Columbidae" },
  "Chalcophaps": { order: "Columbiformes", family: "Columbidae" },
  // Accipitriformes
  "Aquila": { order: "Accipitriformes", family: "Accipitridae" },
  "Hieraaetus": { order: "Accipitriformes", family: "Accipitridae" },
  "Clanga": { order: "Accipitriformes", family: "Accipitridae" },
  "Nisaetus": { order: "Accipitriformes", family: "Accipitridae" },
  "Accipiter": { order: "Accipitriformes", family: "Accipitridae" },
  "Buteo": { order: "Accipitriformes", family: "Accipitridae" },
  "Milvus": { order: "Accipitriformes", family: "Accipitridae" },
  "Haliastur": { order: "Accipitriformes", family: "Accipitridae" },
  "Haliaeetus": { order: "Accipitriformes", family: "Accipitridae" },
  "Gyps": { order: "Accipitriformes", family: "Accipitridae" },
  "Sarcogyps": { order: "Accipitriformes", family: "Accipitridae" },
  "Neophron": { order: "Accipitriformes", family: "Accipitridae" },
  "Spilornis": { order: "Accipitriformes", family: "Accipitridae" },
  "Circaetus": { order: "Accipitriformes", family: "Accipitridae" },
  "Circus": { order: "Accipitriformes", family: "Accipitridae" },
  "Pandion": { order: "Accipitriformes", family: "Pandionidae" },
  // Falconiformes
  "Falco": { order: "Falconiformes", family: "Falconidae" },
  "Microhierax": { order: "Falconiformes", family: "Falconidae" },
  // Strigiformes
  "Bubo": { order: "Strigiformes", family: "Strigidae" },
  "Strix": { order: "Strigiformes", family: "Strigidae" },
  "Athene": { order: "Strigiformes", family: "Strigidae" },
  "Otus": { order: "Strigiformes", family: "Strigidae" },
  "Asio": { order: "Strigiformes", family: "Strigidae" },
  "Glaucidium": { order: "Strigiformes", family: "Strigidae" },
  "Tyto": { order: "Strigiformes", family: "Tytonidae" },
  // Coraciiformes
  "Alcedo": { order: "Coraciiformes", family: "Alcedinidae" },
  "Ceryle": { order: "Coraciiformes", family: "Alcedinidae" },
  "Megaceryle": { order: "Coraciiformes", family: "Alcedinidae" },
  "Halcyon": { order: "Coraciiformes", family: "Alcedinidae" },
  "Todiramphus": { order: "Coraciiformes", family: "Alcedinidae" },
  "Pelargopsis": { order: "Coraciiformes", family: "Alcedinidae" },
  "Merops": { order: "Coraciiformes", family: "Meropidae" },
  "Coracias": { order: "Coraciiformes", family: "Coraciidae" },
  "Eurystomus": { order: "Coraciiformes", family: "Coraciidae" },
  // Piciformes
  "Picus": { order: "Piciformes", family: "Picidae" },
  "Dinopium": { order: "Piciformes", family: "Picidae" },
  "Chrysocolaptes": { order: "Piciformes", family: "Picidae" },
  "Dryocopus": { order: "Piciformes", family: "Picidae" },
  "Dendrocopos": { order: "Piciformes", family: "Picidae" },
  "Yungipicus": { order: "Piciformes", family: "Picidae" },
  "Picumnus": { order: "Piciformes", family: "Picidae" },
  "Megalaima": { order: "Piciformes", family: "Megalaimidae" },
  "Psilopogon": { order: "Piciformes", family: "Megalaimidae" },
  "Indicator": { order: "Piciformes", family: "Indicatoridae" },
  // Cuculiformes
  "Cuculus": { order: "Cuculiformes", family: "Cuculidae" },
  "Hierococcyx": { order: "Cuculiformes", family: "Cuculidae" },
  "Cacomantis": { order: "Cuculiformes", family: "Cuculidae" },
  "Clamator": { order: "Cuculiformes", family: "Cuculidae" },
  "Eudynamys": { order: "Cuculiformes", family: "Cuculidae" },
  "Surniculus": { order: "Cuculiformes", family: "Cuculidae" },
  "Centropus": { order: "Cuculiformes", family: "Cuculidae" },
  "Coccystes": { order: "Cuculiformes", family: "Cuculidae" },
  // Psittaciformes
  "Psittacula": { order: "Psittaciformes", family: "Psittaculidae" },
  "Loriculus": { order: "Psittaciformes", family: "Psittaculidae" },
  // Galliformes
  "Gallus": { order: "Galliformes", family: "Phasianidae" },
  "Pavo": { order: "Galliformes", family: "Phasianidae" },
  "Francolinus": { order: "Galliformes", family: "Phasianidae" },
  "Ortygornis": { order: "Galliformes", family: "Phasianidae" },
  "Coturnix": { order: "Galliformes", family: "Phasianidae" },
  "Lophura": { order: "Galliformes", family: "Phasianidae" },
  "Arborophila": { order: "Galliformes", family: "Phasianidae" },
  "Perdicula": { order: "Galliformes", family: "Phasianidae" },
  // Gruiformes
  "Grus": { order: "Gruiformes", family: "Gruidae" },
  "Antigone": { order: "Gruiformes", family: "Gruidae" },
  "Rallus": { order: "Gruiformes", family: "Rallidae" },
  "Gallinula": { order: "Gruiformes", family: "Rallidae" },
  "Fulica": { order: "Gruiformes", family: "Rallidae" },
  "Porphyrio": { order: "Gruiformes", family: "Rallidae" },
  "Amaurornis": { order: "Gruiformes", family: "Rallidae" },
  // Charadriiformes
  "Charadrius": { order: "Charadriiformes", family: "Charadriidae" },
  "Vanellus": { order: "Charadriiformes", family: "Charadriidae" },
  "Pluvialis": { order: "Charadriiformes", family: "Charadriidae" },
  "Tringa": { order: "Charadriiformes", family: "Scolopacidae" },
  "Calidris": { order: "Charadriiformes", family: "Scolopacidae" },
  "Actitis": { order: "Charadriiformes", family: "Scolopacidae" },
  "Gallinago": { order: "Charadriiformes", family: "Scolopacidae" },
  "Scolopax": { order: "Charadriiformes", family: "Scolopacidae" },
  "Numenius": { order: "Charadriiformes", family: "Scolopacidae" },
  "Limosa": { order: "Charadriiformes", family: "Scolopacidae" },
  "Larus": { order: "Charadriiformes", family: "Laridae" },
  "Chroicocephalus": { order: "Charadriiformes", family: "Laridae" },
  "Sterna": { order: "Charadriiformes", family: "Laridae" },
  "Hydroprogne": { order: "Charadriiformes", family: "Laridae" },
  "Gelochelidon": { order: "Charadriiformes", family: "Laridae" },
  "Thalasseus": { order: "Charadriiformes", family: "Laridae" },
  "Glareola": { order: "Charadriiformes", family: "Glareolidae" },
  "Cursorius": { order: "Charadriiformes", family: "Glareolidae" },
  "Burhinus": { order: "Charadriiformes", family: "Burhinidae" },
  "Rostratula": { order: "Charadriiformes", family: "Rostratulidae" },
  "Metopidius": { order: "Charadriiformes", family: "Jacanidae" },
  "Hydrophasianus": { order: "Charadriiformes", family: "Jacanidae" },
  // Pelecaniformes
  "Pelecanus": { order: "Pelecaniformes", family: "Pelecanidae" },
  "Ardea": { order: "Pelecaniformes", family: "Ardeidae" },
  "Egretta": { order: "Pelecaniformes", family: "Ardeidae" },
  "Bubulcus": { order: "Pelecaniformes", family: "Ardeidae" },
  "Butorides": { order: "Pelecaniformes", family: "Ardeidae" },
  "Ardeola": { order: "Pelecaniformes", family: "Ardeidae" },
  "Nycticorax": { order: "Pelecaniformes", family: "Ardeidae" },
  "Ixobrychus": { order: "Pelecaniformes", family: "Ardeidae" },
  "Threskiornis": { order: "Pelecaniformes", family: "Threskiornithidae" },
  "Pseudibis": { order: "Pelecaniformes", family: "Threskiornithidae" },
  "Platalea": { order: "Pelecaniformes", family: "Threskiornithidae" },
  "Plegadis": { order: "Pelecaniformes", family: "Threskiornithidae" },
  // Ciconiiformes
  "Ciconia": { order: "Ciconiiformes", family: "Ciconiidae" },
  "Ephippiorhynchus": { order: "Ciconiiformes", family: "Ciconiidae" },
  "Leptoptilos": { order: "Ciconiiformes", family: "Ciconiidae" },
  "Anastomus": { order: "Ciconiiformes", family: "Ciconiidae" },
  "Mycteria": { order: "Ciconiiformes", family: "Ciconiidae" },
  // Suliformes
  "Phalacrocorax": { order: "Suliformes", family: "Phalacrocoracidae" },
  "Microcarbo": { order: "Suliformes", family: "Phalacrocoracidae" },
  "Anhinga": { order: "Suliformes", family: "Anhingidae" },
  "Sula": { order: "Suliformes", family: "Sulidae" },
  "Fregata": { order: "Suliformes", family: "Fregatidae" },
  // Anseriformes
  "Anas": { order: "Anseriformes", family: "Anatidae" },
  "Aythya": { order: "Anseriformes", family: "Anatidae" },
  "Mergus": { order: "Anseriformes", family: "Anatidae" },
  "Tadorna": { order: "Anseriformes", family: "Anatidae" },
  "Netta": { order: "Anseriformes", family: "Anatidae" },
  "Mareca": { order: "Anseriformes", family: "Anatidae" },
  "Spatula": { order: "Anseriformes", family: "Anatidae" },
  "Anser": { order: "Anseriformes", family: "Anatidae" },
  "Branta": { order: "Anseriformes", family: "Anatidae" },
  "Cygnus": { order: "Anseriformes", family: "Anatidae" },
  "Dendrocygna": { order: "Anseriformes", family: "Anatidae" },
  "Neochen": { order: "Anseriformes", family: "Anatidae" },
  "Sarkidiornis": { order: "Anseriformes", family: "Anatidae" },
  "Cairina": { order: "Anseriformes", family: "Anatidae" },
  // Bucerotiformes
  "Ocyceros": { order: "Bucerotiformes", family: "Bucerotidae" },
  "Anthracoceros": { order: "Bucerotiformes", family: "Bucerotidae" },
  "Buceros": { order: "Bucerotiformes", family: "Bucerotidae" },
  "Rhyticeros": { order: "Bucerotiformes", family: "Bucerotidae" },
  "Upupa": { order: "Bucerotiformes", family: "Upupidae" },
  // Apodiformes
  "Apus": { order: "Apodiformes", family: "Apodidae" },
  "Cypsiurus": { order: "Apodiformes", family: "Apodidae" },
  "Hirundapus": { order: "Apodiformes", family: "Apodidae" },
  "Hemiprocne": { order: "Apodiformes", family: "Hemiprocnidae" },
  // Caprimulgiformes
  "Caprimulgus": { order: "Caprimulgiformes", family: "Caprimulgidae" },
  "Lyncornis": { order: "Caprimulgiformes", family: "Caprimulgidae" },
};

export function lookupGenusTaxonomy(scientificName: string): {
  order: string; family: string;
} | null {
  if (!scientificName) return null;
  const genus = scientificName.trim().split(/\s+/)[0];
  return GENUS_TAXONOMY[genus] ?? null;
}

export type TaxonomyHit = {
  source: "photos" | "ebird" | null;
  order_name?: string;
  family_name?: string;
  genus?: string;
  species_name?: string;
  iucn_status?: string;
};

/**
 * Cross-references a common name against existing photos (priority)
 * then ebird_lifelist (fallback) to auto-populate taxonomy fields.
 */
export async function lookupTaxonomyByCommonName(commonName: string): Promise<TaxonomyHit> {
  const name = commonName?.trim();
  if (!name) return { source: null };

  // 1) Existing photos table — most reliable
  try {
    const { data } = await supabase
      .from("photos")
      .select("order_name, family_name, genus, species_name, iucn_status")
      .ilike("common_name", `%${name}%`)
      .not("order_name", "is", null)
      .limit(1);
    if (data?.[0]) {
      const r = data[0] as any;
      return {
        source: "photos",
        order_name: r.order_name || undefined,
        family_name: r.family_name || undefined,
        genus: r.genus || undefined,
        species_name: r.species_name || undefined,
        iucn_status: r.iucn_status || undefined,
      };
    }
  } catch {
    /* ignore */
  }

  // 2) eBird life list — only has scientific_name; derive genus
  try {
    const { data } = await supabase
      .from("ebird_lifelist")
      .select("scientific_name, common_name")
      .ilike("common_name", `%${name}%`)
      .limit(1);
    if (data?.[0]) {
      const sci = (data[0] as any).scientific_name as string | null;
      const genus = sci ? sci.split(/\s+/)[0] : undefined;
      const genusTax = sci ? lookupGenusTaxonomy(sci) : null;
      return {
        source: "ebird",
        species_name: sci || undefined,
        genus,
        order_name: genusTax?.order,
        family_name: genusTax?.family,
      };
    }
  } catch {
    /* ignore */
  }

  // 3) Input may itself be a scientific name — try genus lookup directly
  const direct = lookupGenusTaxonomy(name);
  if (direct) {
    return { source: "ebird", order_name: direct.order, family_name: direct.family, genus: name.split(/\s+/)[0] };
  }

  return { source: null };
}
