import { defineEventHandler } from "h3";
import { bankingIntegrationMetadata } from "../../../app/lib/env";

export default defineEventHandler(() => bankingIntegrationMetadata);
