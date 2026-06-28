export type TagDefinitionResponse = {
  id: string;
  name: string;
  matchingTerms: string[];
  isActive: boolean;
  marker: boolean;
  isDefaultMaker: boolean;
};

export type TagDto = {
  id: string;
  name: string;
  matchingTerms: string[];
  isActive: boolean;
  marker?: boolean;
  isDefaultMaker?: boolean;
};

export type SaveTagDto = {
  name: string;
  matchingTerms: string[];
  isActive: boolean;
  marker?: boolean;
  isDefaultMaker?: boolean;
};
