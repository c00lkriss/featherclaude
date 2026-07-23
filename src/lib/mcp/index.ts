import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPhotos from "./tools/search-photos";
import listSpecies from "./tools/list-species";
import getSpeciesPhotos from "./tools/get-species-photos";
import listEbirdWishlist from "./tools/list-ebird-wishlist";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "coolkriss-mcp",
  title: "Coolkriss Birds MCP",
  version: "0.1.0",
  instructions:
    "Tools for querying the Coolkriss bird photography archive: search photos, list photographed species with counts, fetch all photos for a species, and see the eBird wishlist (life-list species not yet photographed). All calls act as the signed-in Coolkriss user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPhotos, listSpecies, getSpeciesPhotos, listEbirdWishlist],
});
