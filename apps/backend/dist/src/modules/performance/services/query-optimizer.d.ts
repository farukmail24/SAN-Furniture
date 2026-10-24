export interface MySqlTuningConfig {
    innodbBufferPoolSize: string;
    innodbLogBufferSize: string;
    maxConnections: number;
}
export interface QueryIndexCompatibility {
    compatible: boolean;
    recommendedIndex: string;
    rationale: string;
}
export declare class QueryOptimizerService {
    generateMySqlTuning(totalRamGb?: number): MySqlTuningConfig;
    verifyQueryIndexCompatibility(querySql: string): QueryIndexCompatibility;
}
