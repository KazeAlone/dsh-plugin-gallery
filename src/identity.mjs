import { demand, text } from "./model.mjs";

/** A principal is accepted only after a trusted server-side provider verifies it. */
export function principal(value) {
  demand(
    value && typeof value === "object",
    401,
    "UNAUTHORIZED",
    "请先验证身份",
  );
  return {
    issuer: text(value.issuer, "身份签发方", 300),
    subject: text(value.subject, "身份标识", 200),
    tenantId: text(value.tenantId ?? "default", "空间标识", 200),
    displayName: text(value.displayName, "姓名", 100),
  };
}
export function sameOwner(a, b) {
  return Boolean(
    a &&
      b &&
      a.issuer === b.issuer &&
      a.subject === b.subject &&
      a.tenantId === b.tenantId,
  );
}
export class EnrollmentIdentityProvider {
  constructor(store) {
    this.store = store;
  }
  async authenticate(request) {
    return this.store.authenticate(
      request.headers.authorization?.match(/^Bearer (.+)$/)?.[1],
    );
  }
  async enroll(input) {
    return this.store.redeemCode(input.code, input.displayName);
  }
}
/** Explicit development opt-in; creates independent identities without a code. */
export class DevelopmentIdentityProvider extends EnrollmentIdentityProvider {
  authMode = "development";
  async enroll(input) {
    const displayName = text(input.displayName, "姓名", 100);
    return this.store.redeemCode(this.store.issueCode().code, displayName);
  }
}
/** The verifier is operator-supplied code; it must validate platform signatures/issuer/audience/expiry. */
export class VerifiedPlatformIdentityProvider {
  constructor(verifyRequest) {
    demand(
      typeof verifyRequest === "function",
      500,
      "INVALID_PROVIDER",
      "需要可信的平台凭证验证器",
    );
    this.verifyRequest = verifyRequest;
  }
  async authenticate(request) {
    return principal(await this.verifyRequest(request));
  }
}
