import FurnitureModuleService from "./service.js";
export declare const FURNITURE_MODULE = "furniture";
declare const _default: import("@medusajs/types").ModuleExports<typeof FurnitureModuleService> & {
    linkable: {
        readonly furnitureSpec: {
            id: {
                serviceName: "furniture";
                field: "furnitureSpec";
                linkable: "furniture_spec_id";
                primaryKey: "id";
            };
            toJSON: () => {
                serviceName: "furniture";
                field: "furnitureSpec";
                linkable: "furniture_spec_id";
                primaryKey: "id";
            };
        };
    };
};
export default _default;
