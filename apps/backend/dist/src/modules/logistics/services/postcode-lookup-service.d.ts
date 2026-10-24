export interface AddressLookupSuggestion {
    id: string;
    formatted_address: string;
    line_1: string;
    line_2?: string;
    city: string;
    county?: string;
    postcode: string;
}
export declare class PostcodeLookupService {
    private apiKey?;
    constructor(apiKey?: string);
    /**
     * Look up address suggestions by UK postcode
     */
    lookupPostcode(postcode: string): Promise<AddressLookupSuggestion[]>;
}
