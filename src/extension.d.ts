interface BsrLink {
  rank: string;
  category: string;
  href: string;
  anchorText: string;
}

interface GetBsrDataRequest {
  type: 'GET_BSR_DATA';
}

interface UpdateBadgeRequest {
  type: 'UPDATE_BADGE';
  hasResults: boolean;
  lowestRank: number | null;
}

interface GetBsrDataResponse {
  isAmazonProductPage: boolean;
  pageUrl: string;
  links: BsrLink[];
}

interface UpdateBadgeResponse {
  success: boolean;
}

interface BsrTabState {
  hasResults: boolean;
  url?: string;
  lowestRank: number | null;
}

interface Window {
  __bsr_links?: BsrLink[];
}