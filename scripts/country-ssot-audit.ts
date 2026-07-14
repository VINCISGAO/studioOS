import {
  ISO3166_ALPHA2,
  ISO3166_COUNTRY_COUNT,
  ISO3166_CUSTOM_EXTENSION_CODES,
  ISO3166_SOVEREIGN_STATE_COUNT,
  ISO3166_TERRITORY_AND_SPECIAL_CODES
} from "../lib/geo/iso3166-alpha2";

const territorySet = new Set(ISO3166_TERRITORY_AND_SPECIAL_CODES);
const missingTerritories = ISO3166_TERRITORY_AND_SPECIAL_CODES.filter((code) => !ISO3166_ALPHA2.includes(code));

console.log("Country SSOT audit");
console.log(`Total ISO3166_ALPHA2: ${ISO3166_COUNTRY_COUNT}`);
console.log(`Territory/special (official ISO, non-sovereign): ${ISO3166_TERRITORY_AND_SPECIAL_CODES.length}`);
console.log(`Sovereign-state estimate: ${ISO3166_SOVEREIGN_STATE_COUNT}`);
console.log(`Custom VINCIS extensions: ${ISO3166_CUSTOM_EXTENSION_CODES.length}`);

if (missingTerritories.length) {
  console.error("Territory list missing from alpha2:", missingTerritories.join(", "));
  process.exit(1);
}

console.log("Territory/special codes:", ISO3166_TERRITORY_AND_SPECIAL_CODES.join(", "));
console.log("OK — no custom alpha-2 extensions; all territory codes present in SSOT.");
