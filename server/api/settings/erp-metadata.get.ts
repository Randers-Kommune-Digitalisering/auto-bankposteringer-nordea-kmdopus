import { defineEventHandler } from "h3";
import { erpIntegrationMetadata } from "../../../app/lib/env/env";

export default defineEventHandler(() => erpIntegrationMetadata);
