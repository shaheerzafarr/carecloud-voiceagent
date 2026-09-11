// EMAIL ENUMS
export enum EmailTemplate {}

export enum EmailSubject {}

// FILESIZE ENUMS
export enum FileSize {
  FIVE_MB = 5_000_000, // 5 MB
  TEN_MB = 10_000_000, // 10 MB
  TWENTY_MB = 20_000_000, // 20 MB
  FIFTY_MB = 50_000_000, // 50 MB
}

export enum SYSTEM_COOKIES {
  ACCESS_TOKEN = '_ATU',
  REFRESH_TOKEN = '_RTU',
}

export enum SEARCH_CAPABILITIES {
  CONTAINS = 'contains',
  ABSOLUTE = 'absolute',
  NOT_CONTAINS = 'notContains',
  GREATER_THAN = 'greaterThan',
  LESS_THEN = 'lessThan',
  EQUAL_TO = 'equalTo',
  NOT_EQUAL_TO = 'notEqualTo',
}

export enum SORT_ORDER {
  ASC = 'ASC',
  DESC = 'DESC',
}
