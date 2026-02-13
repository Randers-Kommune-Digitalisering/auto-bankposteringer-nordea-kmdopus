import { defineEventHandler } from "h3";
import { erpIntegrationMetadata } from "../../../app/lib/env";

export default defineEventHandler(() => erpIntegrationMetadata);
