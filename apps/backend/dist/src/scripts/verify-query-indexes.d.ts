export interface QueryIndexVerification {
    queryName: string;
    sqlPattern: string;
    targetIndex: string;
    indexColumns: string[];
    explanation: string;
}
export declare const VERIFIED_INDEX_PATTERNS: QueryIndexVerification[];
export declare function validateAllIndexPatterns(): boolean;
