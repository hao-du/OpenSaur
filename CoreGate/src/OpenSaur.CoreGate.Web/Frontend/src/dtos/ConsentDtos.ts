export type ConsentScopeItem = {
  name: string;
  description: string;
};

export type ConsentDetailsResponse = {
  clientDisplayName: string;
  scopes: ConsentScopeItem[];
  returnUrl: string;
};

export type ConsentDecisionRequest = {
  decision: "accept" | "reject";
  returnUrl: string;
};

export type ConsentDecisionResponse = {
  redirectUrl: string;
};
