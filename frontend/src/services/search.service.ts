import { api } from "./api";

export class SearchService {
  async globalSearch(query: string) {
    return api.get(`/search?q=${encodeURIComponent(query)}`);
  }
}

export const searchService = new SearchService();
