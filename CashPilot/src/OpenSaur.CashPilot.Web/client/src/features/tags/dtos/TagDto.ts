export type TagDto = {
  id: string;
  name: string;
  matchingTerms: string[];
  isActive: boolean;
};

export type SaveTagDto = {
  name: string;
  matchingTerms: string[];
  isActive: boolean;
};
