import { Module } from "@medusajs/framework/utils";
import FurnitureModuleService from "./service.js";

export const FURNITURE_MODULE = "furniture";

export default Module(FURNITURE_MODULE, {
  service: FurnitureModuleService,
});
