import { z } from "zod";
import { DeliveryTierEnum } from "./furniture.js";
/**
 * UK Postcode Zones
 */
export const UKPostcodeZoneEnum = z.enum([
    "zone_1_mainland", // England, Wales, Southern Scotland
    "zone_2_scottish_highlands", // Inverness, Highlands postcodes (IV, KW1-14, etc.)
    "zone_3_scottish_islands", // Outer Hebrides, Shetland, Orkney (HS, ZE, etc.)
    "zone_4_northern_ireland", // BT postcodes
    "zone_5_uk_offshore", // Isle of Man (IM), Scilly Isles (TR21-25)
    "zone_excluded" // Channel Islands (GY, JE)
]);
/**
 * Standard UK Address Schema
 */
export const UKAddressSchema = z.object({
    recipient_name: z.string().min(2, "Recipient name is required"),
    line_1: z.string().min(3, "Address line 1 is required"),
    line_2: z.string().optional(),
    city: z.string().min(2, "City/Town is required"),
    county: z.string().optional(),
    postcode: z.string().regex(/^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z]?))))\s?[0-9][A-Za-z]{2})$/, "Invalid UK Postcode format"),
    country_code: z.literal("GB").default("GB"),
    phone: z.string().min(10, "UK mobile or telephone number required for delivery booking")
});
/**
 * Detailed E-Commerce Billing Address Schema
 */
export const BillingAddressSchema = z.object({
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    company: z.string().trim().optional(),
    address_1: z.string().trim().min(3, "Address line 1 is required"),
    address_2: z.string().trim().optional(),
    city: z.string().trim().min(2, "City is required"),
    postcode: z.string().trim().min(2, "Postcode is required"),
    country: z.string().trim().default("United Kingdom"),
    state: z.string().trim().optional(),
    email: z.string().trim().email("Valid billing email required"),
    phone: z.string().trim().min(10, "Valid billing phone required")
});
/**
 * Detailed E-Commerce Shipping Address Schema
 */
export const ShippingAddressSchema = z.object({
    first_name: z.string().trim().min(1, "First name is required"),
    last_name: z.string().trim().min(1, "Last name is required"),
    company: z.string().trim().optional(),
    address_1: z.string().trim().min(3, "Address line 1 is required"),
    address_2: z.string().trim().optional(),
    city: z.string().trim().min(2, "City is required"),
    postcode: z.string().trim().min(2, "Postcode is required"),
    country: z.string().trim().default("United Kingdom"),
    state: z.string().trim().optional()
});
/**
 * Classify a UK postcode into a logistics zone
 */
export function classifyUKPostcode(postcode) {
    const clean = postcode.toUpperCase().replace(/\s+/g, "");
    // Channel Islands
    if (/^(GY|JE)/.test(clean)) {
        return "zone_excluded";
    }
    // Northern Ireland
    if (/^BT/.test(clean)) {
        return "zone_4_northern_ireland";
    }
    // Scottish Offshore Islands
    if (/^(HS|ZE|KW15|KW16|KW17|PA20|PA4[1-9]|PA6[0-9]|PA7[0-8]|PH4[1-4]|KA27|KA28)/.test(clean)) {
        return "zone_3_scottish_islands";
    }
    // Scottish Highlands
    if (/^(IV|KW[1-9]|KW1[0-4]|PA34|PA3[7-9]|PH19|PH2[0-6]|PH3[0-9]|PH40|PH49|PH50)/.test(clean)) {
        return "zone_2_scottish_highlands";
    }
    // Offshore UK (Isle of Man, Scilly)
    if (/^(IM|TR2[1-5])/.test(clean)) {
        return "zone_5_uk_offshore";
    }
    // Standard UK Mainland
    return "zone_1_mainland";
}
export const UK_MAINLAND_REGIONS = [
    {
        key: "london",
        name: "London",
        prefixes: ["E", "EC", "N", "NW", "SE", "SW", "W", "WC"],
        description: "Greater London & City of London Metropolitan Areas",
    },
    {
        key: "south_east",
        name: "South East England",
        prefixes: ["BN", "BR", "CT", "GU", "KT", "ME", "OX", "RG", "RH", "SL", "SO", "TN", "DA", "EN", "HA", "IG", "RM", "SM", "TW", "UB", "PO"],
        description: "Surrey, Kent, Sussex, Hampshire, Berkshire & Oxfordshire",
    },
    {
        key: "south_west",
        name: "South West England",
        prefixes: ["BA", "BS", "EX", "GL", "PL", "SN", "SP", "TA", "TQ", "TR", "DT", "BH"],
        description: "Bristol, Gloucestershire, Somerset, Devon, Cornwall & Dorset",
    },
    {
        key: "east_england",
        name: "East of England",
        prefixes: ["AL", "CB", "CM", "CO", "IP", "LU", "NR", "PE", "SG", "SS", "MK", "HP", "WD"],
        description: "Cambridgeshire, Norfolk, Suffolk, Essex, Hertfordshire & Bedfordshire",
    },
    {
        key: "east_midlands",
        name: "East Midlands",
        prefixes: ["DE", "LE", "LN", "NG", "NN"],
        description: "Leicestershire, Nottinghamshire, Derbyshire, Lincolnshire & Northamptonshire",
    },
    {
        key: "west_midlands",
        name: "West Midlands",
        prefixes: ["B", "CV", "DY", "HR", "ST", "TF", "WR", "WS", "WV"],
        description: "Birmingham, Coventry, Black Country, Staffordshire, Worcestershire & Warwickshire",
    },
    {
        key: "yorkshire_humber",
        name: "Yorkshire & Humber",
        prefixes: ["BD", "DN", "HD", "HG", "HX", "LS", "S", "WF", "YO", "HU"],
        description: "Leeds, Sheffield, Bradford, York, Wakefield & East Riding",
    },
    {
        key: "north_west",
        name: "North West England",
        prefixes: ["BB", "BL", "CA", "CH", "CW", "FY", "L", "LA", "M", "OL", "PR", "SK", "WA", "WN"],
        description: "Greater Manchester, Merseyside, Lancashire, Cheshire & Cumbria",
    },
    {
        key: "north_east",
        name: "North East England",
        prefixes: ["DH", "DL", "NE", "SR", "TS"],
        description: "Newcastle upon Tyne, Sunderland, Durham, Darlington & Teesside",
    },
    {
        key: "scotland_mainland",
        name: "Scotland Mainland",
        prefixes: ["AB", "DD", "DG", "EH", "FK", "G", "KA", "KY", "ML", "PA", "PH", "TD"],
        description: "Edinburgh, Glasgow, Aberdeen, Dundee, Ayrshire & Scottish Central Belt",
    },
    {
        key: "wales",
        name: "Wales",
        prefixes: ["CF", "LD", "LL", "NP", "SA", "SY"],
        description: "Cardiff, Swansea, Newport, Powys, Gwynedd & Clwyd",
    },
];
/**
 * High-accuracy UK Postcode Outcode to City, County and Region Lookup Table
 */
export const UK_POSTCODE_AREA_DATA = {
    // West Midlands (including CV Coventry!)
    CV: { city: "Coventry", county: "West Midlands", regionKey: "west_midlands", regionName: "West Midlands" },
    B: { city: "Birmingham", county: "West Midlands", regionKey: "west_midlands", regionName: "West Midlands" },
    DY: { city: "Dudley", county: "West Midlands", regionKey: "west_midlands", regionName: "West Midlands" },
    WS: { city: "Walsall", county: "West Midlands", regionKey: "west_midlands", regionName: "West Midlands" },
    WV: { city: "Wolverhampton", county: "West Midlands", regionKey: "west_midlands", regionName: "West Midlands" },
    ST: { city: "Stoke-on-Trent", county: "Staffordshire", regionKey: "west_midlands", regionName: "West Midlands" },
    WR: { city: "Worcester", county: "Worcestershire", regionKey: "west_midlands", regionName: "West Midlands" },
    HR: { city: "Hereford", county: "Herefordshire", regionKey: "west_midlands", regionName: "West Midlands" },
    TF: { city: "Telford", county: "Shropshire", regionKey: "west_midlands", regionName: "West Midlands" },
    // London
    SW: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    W: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    EC: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    WC: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    NW: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    SE: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    E: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    N: { city: "London", county: "Greater London", regionKey: "london", regionName: "London" },
    // North West
    M: { city: "Manchester", county: "Greater Manchester", regionKey: "north_west", regionName: "North West England" },
    L: { city: "Liverpool", county: "Merseyside", regionKey: "north_west", regionName: "North West England" },
    PR: { city: "Preston", county: "Lancashire", regionKey: "north_west", regionName: "North West England" },
    BB: { city: "Blackburn", county: "Lancashire", regionKey: "north_west", regionName: "North West England" },
    BL: { city: "Bolton", county: "Greater Manchester", regionKey: "north_west", regionName: "North West England" },
    FY: { city: "Blackpool", county: "Lancashire", regionKey: "north_west", regionName: "North West England" },
    OL: { city: "Oldham", county: "Greater Manchester", regionKey: "north_west", regionName: "North West England" },
    SK: { city: "Stockport", county: "Greater Manchester", regionKey: "north_west", regionName: "North West England" },
    WA: { city: "Warrington", county: "Cheshire", regionKey: "north_west", regionName: "North West England" },
    WN: { city: "Wigan", county: "Greater Manchester", regionKey: "north_west", regionName: "North West England" },
    CH: { city: "Chester", county: "Cheshire", regionKey: "north_west", regionName: "North West England" },
    CW: { city: "Crewe", county: "Cheshire", regionKey: "north_west", regionName: "North West England" },
    CA: { city: "Carlisle", county: "Cumbria", regionKey: "north_west", regionName: "North West England" },
    LA: { city: "Lancaster", county: "Lancashire", regionKey: "north_west", regionName: "North West England" },
    // East Midlands
    LE: { city: "Leicester", county: "Leicestershire", regionKey: "east_midlands", regionName: "East Midlands" },
    NG: { city: "Nottingham", county: "Nottinghamshire", regionKey: "east_midlands", regionName: "East Midlands" },
    DE: { city: "Derby", county: "Derbyshire", regionKey: "east_midlands", regionName: "East Midlands" },
    LN: { city: "Lincoln", county: "Lincolnshire", regionKey: "east_midlands", regionName: "East Midlands" },
    NN: { city: "Northampton", county: "Northamptonshire", regionKey: "east_midlands", regionName: "East Midlands" },
    // Yorkshire & Humber
    LS: { city: "Leeds", county: "West Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    S: { city: "Sheffield", county: "South Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    BD: { city: "Bradford", county: "West Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    HD: { city: "Huddersfield", county: "West Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    HG: { city: "Harrogate", county: "North Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    HX: { city: "Halifax", county: "West Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    WF: { city: "Wakefield", county: "West Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    YO: { city: "York", county: "North Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    DN: { city: "Doncaster", county: "South Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    HU: { city: "Hull", county: "East Riding of Yorkshire", regionKey: "yorkshire_humber", regionName: "Yorkshire & Humber" },
    // South East
    BN: { city: "Brighton", county: "East Sussex", regionKey: "south_east", regionName: "South East England" },
    BR: { city: "Bromley", county: "Kent", regionKey: "south_east", regionName: "South East England" },
    CT: { city: "Canterbury", county: "Kent", regionKey: "south_east", regionName: "South East England" },
    DA: { city: "Dartford", county: "Kent", regionKey: "south_east", regionName: "South East England" },
    GU: { city: "Guildford", county: "Surrey", regionKey: "south_east", regionName: "South East England" },
    KT: { city: "Kingston upon Thames", county: "Surrey", regionKey: "south_east", regionName: "South East England" },
    ME: { city: "Maidstone", county: "Kent", regionKey: "south_east", regionName: "South East England" },
    OX: { city: "Oxford", county: "Oxfordshire", regionKey: "south_east", regionName: "South East England" },
    RG: { city: "Reading", county: "Berkshire", regionKey: "south_east", regionName: "South East England" },
    RH: { city: "Redhill", county: "Surrey", regionKey: "south_east", regionName: "South East England" },
    SL: { city: "Slough", county: "Berkshire", regionKey: "south_east", regionName: "South East England" },
    SO: { city: "Southampton", county: "Hampshire", regionKey: "south_east", regionName: "South East England" },
    PO: { city: "Portsmouth", county: "Hampshire", regionKey: "south_east", regionName: "South East England" },
    TN: { city: "Tunbridge Wells", county: "Kent", regionKey: "south_east", regionName: "South East England" },
    EN: { city: "Enfield", county: "Greater London", regionKey: "south_east", regionName: "South East England" },
    HA: { city: "Harrow", county: "Greater London", regionKey: "south_east", regionName: "South East England" },
    IG: { city: "Ilford", county: "Essex", regionKey: "south_east", regionName: "South East England" },
    RM: { city: "Romford", county: "Essex", regionKey: "south_east", regionName: "South East England" },
    SM: { city: "Sutton", county: "Surrey", regionKey: "south_east", regionName: "South East England" },
    TW: { city: "Twickenham", county: "Greater London", regionKey: "south_east", regionName: "South East England" },
    UB: { city: "Uxbridge", county: "Greater London", regionKey: "south_east", regionName: "South East England" },
    // South West
    BS: { city: "Bristol", county: "Bristol", regionKey: "south_west", regionName: "South West England" },
    BA: { city: "Bath", county: "Somerset", regionKey: "south_west", regionName: "South West England" },
    EX: { city: "Exeter", county: "Devon", regionKey: "south_west", regionName: "South West England" },
    GL: { city: "Gloucester", county: "Gloucestershire", regionKey: "south_west", regionName: "South West England" },
    PL: { city: "Plymouth", county: "Devon", regionKey: "south_west", regionName: "South West England" },
    SN: { city: "Swindon", county: "Wiltshire", regionKey: "south_west", regionName: "South West England" },
    SP: { city: "Salisbury", county: "Wiltshire", regionKey: "south_west", regionName: "South West England" },
    TA: { city: "Taunton", county: "Somerset", regionKey: "south_west", regionName: "South West England" },
    TQ: { city: "Torquay", county: "Devon", regionKey: "south_west", regionName: "South West England" },
    TR: { city: "Truro", county: "Cornwall", regionKey: "south_west", regionName: "South West England" },
    DT: { city: "Dorchester", county: "Dorset", regionKey: "south_west", regionName: "South West England" },
    BH: { city: "Bournemouth", county: "Dorset", regionKey: "south_west", regionName: "South West England" },
    // East of England
    AL: { city: "St Albans", county: "Hertfordshire", regionKey: "east_england", regionName: "East of England" },
    CB: { city: "Cambridge", county: "Cambridgeshire", regionKey: "east_england", regionName: "East of England" },
    CM: { city: "Chelmsford", county: "Essex", regionKey: "east_england", regionName: "East of England" },
    CO: { city: "Colchester", county: "Essex", regionKey: "east_england", regionName: "East of England" },
    IP: { city: "Ipswich", county: "Suffolk", regionKey: "east_england", regionName: "East of England" },
    LU: { city: "Luton", county: "Bedfordshire", regionKey: "east_england", regionName: "East of England" },
    NR: { city: "Norwich", county: "Norfolk", regionKey: "east_england", regionName: "East of England" },
    PE: { city: "Peterborough", county: "Cambridgeshire", regionKey: "east_england", regionName: "East of England" },
    SG: { city: "Stevenage", county: "Hertfordshire", regionKey: "east_england", regionName: "East of England" },
    SS: { city: "Southend-on-Sea", county: "Essex", regionKey: "east_england", regionName: "East of England" },
    MK: { city: "Milton Keynes", county: "Buckinghamshire", regionKey: "east_england", regionName: "East of England" },
    HP: { city: "Hemel Hempstead", county: "Hertfordshire", regionKey: "east_england", regionName: "East of England" },
    WD: { city: "Watford", county: "Hertfordshire", regionKey: "east_england", regionName: "East of England" },
    // North East
    NE: { city: "Newcastle upon Tyne", county: "Tyne and Wear", regionKey: "north_east", regionName: "North East England" },
    SR: { city: "Sunderland", county: "Tyne and Wear", regionKey: "north_east", regionName: "North East England" },
    DH: { city: "Durham", county: "County Durham", regionKey: "north_east", regionName: "North East England" },
    DL: { city: "Darlington", county: "County Durham", regionKey: "north_east", regionName: "North East England" },
    TS: { city: "Middlesbrough", county: "North Yorkshire", regionKey: "north_east", regionName: "North East England" },
    // Scotland Mainland
    EH: { city: "Edinburgh", county: "City of Edinburgh", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    G: { city: "Glasgow", county: "Glasgow City", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    AB: { city: "Aberdeen", county: "Aberdeenshire", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    DD: { city: "Dundee", county: "Angus", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    DG: { city: "Dumfries", county: "Dumfries and Galloway", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    FK: { city: "Falkirk", county: "Stirlingshire", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    KA: { city: "Kilmarnock", county: "Ayrshire", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    KY: { city: "Kirkcaldy", county: "Fife", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    ML: { city: "Motherwell", county: "Lanarkshire", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    PA: { city: "Paisley", county: "Renfrewshire", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    PH: { city: "Perth", county: "Perthshire", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    TD: { city: "Galashiels", county: "Scottish Borders", regionKey: "scotland_mainland", regionName: "Scotland Mainland" },
    // Wales
    CF: { city: "Cardiff", county: "South Glamorgan", regionKey: "wales", regionName: "Wales" },
    SA: { city: "Swansea", county: "West Glamorgan", regionKey: "wales", regionName: "Wales" },
    NP: { city: "Newport", county: "Gwent", regionKey: "wales", regionName: "Wales" },
    LL: { city: "Llandudno", county: "Conwy", regionKey: "wales", regionName: "Wales" },
    LD: { city: "Llandrindod Wells", county: "Powys", regionKey: "wales", regionName: "Wales" },
    SY: { city: "Shrewsbury / Powys", county: "Shropshire / Powys", regionKey: "wales", regionName: "Wales" },
};
/**
 * Extract area prefix from clean postcode (e.g. "CV79EU" -> "CV", "SW1A1AA" -> "SW", "M11AE" -> "M")
 */
export function extractUKPostcodeArea(postcode) {
    const clean = (postcode || "").toUpperCase().replace(/\s+/g, "");
    const match = clean.match(/^([A-Z]{1,2})/);
    return (match && match[1]) ? match[1] : "";
}
/**
 * Determine if a postcode is located in Mainland UK
 */
export function isMainlandUKPostcode(postcode) {
    const clean = (postcode || "").toUpperCase().replace(/\s+/g, "");
    if (!clean)
        return false;
    // Explicit non-mainland outcodes
    if (/^(GY|JE|BT|IM)/.test(clean))
        return false;
    if (/^(HS|ZE)/.test(clean))
        return false;
    if (/^(TR21|TR22|TR23|TR24|TR25)/.test(clean))
        return false; // Scilly Isles
    if (/^(KW15|KW16|KW17)/.test(clean))
        return false; // Orkney
    if (/^(PA20|PA4[1-9]|PA6[0-9]|PA7[0-8]|PH4[1-4]|KA27|KA28)/.test(clean))
        return false; // Scottish offshore islands
    return true;
}
/**
 * Comprehensive resolver for UK postcode details (City, County, Region, Mainland status)
 */
export function resolveUKPostcodeInfo(postcode) {
    const clean = (postcode || "").toUpperCase().replace(/\s+/g, "");
    const area = extractUKPostcodeArea(clean);
    const isMainland = isMainlandUKPostcode(clean);
    const matchedArea = UK_POSTCODE_AREA_DATA[area] || null;
    return {
        postcode: clean.length > 3 ? `${clean.slice(0, clean.length - 3)} ${clean.slice(clean.length - 3)}` : clean,
        cleanPostcode: clean,
        areaPrefix: area,
        isMainland,
        city: matchedArea?.city || (isMainland ? "London" : "UK Non-Mainland"),
        county: matchedArea?.county || (isMainland ? "Greater London" : "United Kingdom"),
        regionKey: matchedArea?.regionKey || (isMainland ? "london" : "remote_offshore"),
        regionName: matchedArea?.regionName || (isMainland ? "London & South" : "Remote / Offshore UK"),
    };
}
/**
 * Shipping rate calculation schema
 */
export const ShippingQuoteRequestSchema = z.object({
    postcode: z.string(),
    delivery_tier: DeliveryTierEnum,
    order_subtotal_pennies: z.number().int().nonnegative()
});
export const ShippingQuoteResponseSchema = z.object({
    zone: UKPostcodeZoneEnum,
    base_rate_pennies: z.number().int().nonnegative(),
    surcharge_pennies: z.number().int().nonnegative(),
    total_shipping_pennies: z.number().int().nonnegative(),
    is_deliverable: z.boolean(),
    estimated_days_min: z.number().int(),
    estimated_days_max: z.number().int(),
    disclaimer: z.string().optional()
});
//# sourceMappingURL=logistics.js.map