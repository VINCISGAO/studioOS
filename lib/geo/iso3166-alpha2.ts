/** ISO 3166-1 alpha-2 codes — all MA-assigned codes (250). SSOT for country pickers. */
export const ISO3166_ALPHA2_CSV =
  "AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW";

export const ISO3166_ALPHA2 = ISO3166_ALPHA2_CSV.split(",") as string[];

/**
 * Total MA-assigned ISO 3166-1 alpha-2 codes in this SSOT.
 * ISO publishes 249 "officially assigned" codes in some snapshots; this list includes
 * all 250 active assignments used by Intl.DisplayNames region data (incl. territories).
 */
export const ISO3166_COUNTRY_COUNT = ISO3166_ALPHA2.length;

/**
 * Official ISO codes for dependent territories, areas of special interest, and
 * discrete regions — still ISO 3166-1 assigned, but not UN member sovereign states.
 * VINCIS does NOT add custom alpha-2 codes (no XK, no user-assigned QM–QZ, etc.).
 */
export const ISO3166_TERRITORY_AND_SPECIAL_CODES = [
  "AI",
  "AQ",
  "AS",
  "AW",
  "AX",
  "BL",
  "BM",
  "BQ",
  "BV",
  "CC",
  "CK",
  "CX",
  "EH",
  "FK",
  "FO",
  "GF",
  "GG",
  "GI",
  "GL",
  "GP",
  "GS",
  "GU",
  "HK",
  "HM",
  "IM",
  "IO",
  "JE",
  "KY",
  "MF",
  "MO",
  "MP",
  "MQ",
  "MS",
  "NC",
  "NF",
  "NU",
  "PF",
  "PM",
  "PN",
  "PR",
  "PS",
  "RE",
  "SH",
  "SJ",
  "SX",
  "TC",
  "TF",
  "TK",
  "TL",
  "TV",
  "TW",
  "UM",
  "VG",
  "VI",
  "WF",
  "YT"
] as const;

/** Custom / non-ISO extensions maintained by VINCIS (must stay empty). */
export const ISO3166_CUSTOM_EXTENSION_CODES: readonly string[] = [];

export const ISO3166_SOVEREIGN_STATE_COUNT =
  ISO3166_COUNTRY_COUNT - ISO3166_TERRITORY_AND_SPECIAL_CODES.length;
