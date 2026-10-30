import type { components } from "./schema";

type Schemas = components["schemas"];

export type CodeChallenge = Schemas["CodeChallenge"];
export type LoginError = Schemas["LoginError"];
export type SignInResult = Schemas["SignInResult"];
export type ClientOption = Schemas["ClientOption"];
export type Reactivation = Schemas["Reactivation"];
export type NoAccess = Schemas["NoAccess"];
export type PortalSessionInfo = Schemas["PortalSessionInfo"];
export type Home = Schemas["Home"];
export type BureauScore = Schemas["BureauScore"];
export type CreditReport = Schemas["CreditReport"];
export type Payments = Schemas["Payments"];
export type PaymentItem = Schemas["PaymentItem"];
export type Receipt = Schemas["Receipt"];
export type Profile = Schemas["Profile"];
export type AccessSession = Schemas["AccessSession"];
export type Card = Schemas["Card"];
export type NewCard = Schemas["NewCard"];
export type PayNow = Schemas["PayNow"];
export type PaymentResult = Schemas["PaymentResult"];
export type Document = Schemas["Document"];
export type Letter = Schemas["Letter"];
